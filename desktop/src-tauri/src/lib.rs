pub mod layout_manager;
pub mod web_blanket;

use base64::prelude::*;
use core_foundation::base::TCFType;
use core_graphics::display::CGDisplay;
use core_graphics::event::CGEvent;
use core_graphics::event_source::{CGEventSource, CGEventSourceStateID};
use layout_manager::{get_open_windows, restore_windows, WindowInfo};
use std::sync::atomic::{AtomicBool, AtomicU8, Ordering};
use std::time::Duration;
use tauri::{Emitter, Manager, PhysicalPosition, image::Image, AppHandle};
use tauri::menu::{Menu, MenuItem, MenuEvent, Submenu, PredefinedMenuItem};
use tauri::tray::TrayIconBuilder;
use tauri_plugin_sql::{Migration, MigrationKind};
use arboard::Clipboard;
use sqlx::sqlite::SqlitePoolOptions;
use std::hash::{Hash, Hasher};
use std::collections::hash_map::DefaultHasher;
use image::ImageEncoder;
use serde_json::json;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

static IS_DRAWER_OPEN: AtomicBool = AtomicBool::new(false);
static IS_ANIMATING: AtomicBool = AtomicBool::new(false);
static DRAWER_CONFIG: AtomicU8 = AtomicU8::new(0); // 0=Left, 1=Right, 2=HotCorners
static LAST_ACTIVE_SIDE: AtomicU8 = AtomicU8::new(0); // 0=Left, 1=Right

fn start_clipboard_monitor(app_handle: tauri::AppHandle) {
    std::thread::spawn(move || {
        let mut clipboard = match Clipboard::new() {
            Ok(c) => c,
            Err(e) => {
                eprintln!("Failed to init clipboard: {}", e);
                return;
            }
        };

        let db_path = app_handle.path().app_data_dir().unwrap().join("mydrawer.db");
        let conn_str = format!("sqlite://{}", db_path.to_string_lossy());
        
        // Wait for DB to be created by plugin
        std::thread::sleep(Duration::from_secs(2));

        let rt = tokio::runtime::Runtime::new().unwrap();
        
        rt.block_on(async {
            let pool = loop {
                match SqlitePoolOptions::new().connect(&conn_str).await {
                    Ok(p) => break p,
                    Err(_) => {
                        std::thread::sleep(Duration::from_secs(1));
                        continue;
                    }
                }
            };

            let mut last_text_content = String::new();
            let mut last_image_hash: u64 = 0;

            loop {
                // 1. Check Text
                if let Ok(current_text) = clipboard.get_text() {
                    if !current_text.trim().is_empty() && current_text != last_text_content {
                        last_text_content = current_text.clone();
                        last_image_hash = 0;
                        
                        let id = uuid::Uuid::new_v4().to_string();
                        let now = chrono::Utc::now().to_rfc3339();
                        
                        let _ = sqlx::query("INSERT INTO clipboard (id, content, source_app, timestamp, character_count, pinned) VALUES (?, ?, ?, ?, ?, ?)")
                            .bind(id)
                            .bind(&current_text)
                            .bind("System")
                            .bind(now)
                            .bind(current_text.len() as i32)
                            .bind(false)
                            .execute(&pool)
                            .await;

                        // Enforce Limit
                        let limit_row: Option<(String,)> = sqlx::query_as("SELECT value FROM settings WHERE key = 'clipboard_history_limit'")
                            .fetch_optional(&pool)
                            .await
                            .unwrap_or(None);
                        let limit = limit_row.and_then(|r| r.0.parse::<i32>().ok()).unwrap_or(50);

                        if limit > 0 {
                             let _ = sqlx::query("DELETE FROM clipboard WHERE id NOT IN (SELECT id FROM clipboard ORDER BY timestamp DESC LIMIT ?) AND pinned = 0")
                                .bind(limit)
                                .execute(&pool)
                                .await;
                        }
                            
                        let _ = app_handle.emit("clipboard-changed", ());
                    }
                }

                // 2. Check Image
                if let Ok(img) = clipboard.get_image() {
                    let mut hasher = DefaultHasher::new();
                    img.bytes.hash(&mut hasher);
                    let current_hash = hasher.finish();

                    if current_hash != last_image_hash && current_hash != 0 {
                        last_image_hash = current_hash;
                        last_text_content.clear();

                        let width = img.width;
                        let height = img.height;
                        let raw_bytes = img.bytes.into_owned();

                        let mut png_buffer = Vec::new();
                        let encoder = image::codecs::png::PngEncoder::new(&mut png_buffer);
                        
                        if let Ok(_) = encoder.write_image(&raw_bytes, width as u32, height as u32, image::ColorType::Rgba8) {
                             let base64_string = BASE64_STANDARD.encode(&png_buffer);
                             let content = format!("data:image/png;base64,{}", base64_string);

                             let id = uuid::Uuid::new_v4().to_string();
                             let now = chrono::Utc::now().to_rfc3339();

                             let _ = sqlx::query("INSERT INTO clipboard (id, content, source_app, timestamp, character_count, pinned) VALUES (?, ?, ?, ?, ?, ?)")
                                .bind(id)
                                .bind(&content)
                                .bind("System")
                                .bind(now)
                                .bind(0)
                                .bind(false)
                                .execute(&pool)
                                .await;

                             // Enforce Limit
                             let limit_row: Option<(String,)> = sqlx::query_as("SELECT value FROM settings WHERE key = 'clipboard_history_limit'")
                                 .fetch_optional(&pool)
                                 .await
                                 .unwrap_or(None);
                             let limit = limit_row.and_then(|r| r.0.parse::<i32>().ok()).unwrap_or(50);
     
                             if limit > 0 {
                                  let _ = sqlx::query("DELETE FROM clipboard WHERE id NOT IN (SELECT id FROM clipboard ORDER BY timestamp DESC LIMIT ?) AND pinned = 0")
                                     .bind(limit)
                                     .execute(&pool)
                                     .await;
                             }

                             let _ = app_handle.emit("clipboard-changed", ());
                        }
                    }
                }
                
                tokio::time::sleep(Duration::from_secs(1)).await;
            }
        });
    });
}

#[tauri::command]
fn set_drawer_config(config: String) {
    let val = match config.as_str() {
        "left" => 0,
        "right" => 1,
        "hot-corners" => 2,
        "top-left" => 3,
        "bottom-left" => 4,
        "top-right" => 5,
        "bottom-right" => 6,
        _ => 0,
    };
    DRAWER_CONFIG.store(val, Ordering::Relaxed);
}

#[tauri::command]
fn hide_drawer(window: tauri::Window) {
    if !IS_DRAWER_OPEN.load(Ordering::Relaxed) || IS_ANIMATING.load(Ordering::Relaxed) {
        return;
    }

    std::thread::spawn(move || {
        IS_ANIMATING.store(true, Ordering::Relaxed);

        let monitor = window
            .current_monitor()
            .ok()
            .flatten()
            .or_else(|| window.primary_monitor().ok().flatten());
        let scale_factor = monitor.as_ref().map(|m| m.scale_factor()).unwrap_or(2.0);
        let screen_height = monitor.as_ref().map(|m| m.size().height).unwrap_or(2160); // Default to a common Retina height
        let screen_width = monitor.as_ref().map(|m| m.size().width).unwrap_or(3840) as f64; // Approx 4k width

        let width = 400.0 * scale_factor;
        let height = 800.0 * scale_factor;

        let active_side = LAST_ACTIVE_SIDE.load(Ordering::Relaxed);

        // Calculate Start (Current) and End X
        // For hiding: End is off-screen.
        // If Left: End = -width.
        // If Right: End = screen_width.
        
        let end_x = if active_side == 1 {
            screen_width as i32
        } else {
            -width as i32
        };

        // We assume current position is the "Open" position
        // Left Open: 30
        // Right Open: screen_width - width - 30
        let start_x = if active_side == 1 {
             (screen_width - width - 20.0 * scale_factor) as i32
        } else {
             (20.0 * scale_factor) as i32
        };
        
        let center_y = ((screen_height as f64 - height) / 2.0) as i32;

        let duration_ms = 200;
        let steps = 20;
        let step_delay = duration_ms / steps;

        for i in 0..=steps {
            let t = i as f64 / steps as f64;
            // Ease out cubic
            let eased_t = 1.0 - (1.0 - t).powi(3);
            let current_x = (start_x as f64 + (end_x as f64 - start_x as f64) * eased_t) as i32;

            window
                .set_position(PhysicalPosition::new(current_x, center_y))
                .unwrap_or(());
            std::thread::sleep(Duration::from_millis(step_delay));
        }

        // Ensure final position
        window
            .set_position(PhysicalPosition::new(end_x, center_y))
            .unwrap_or(());

        // Hide window to prevent ghosting on space switch
        window.hide().unwrap_or(());

        // Enable click-through when hidden
        window.set_ignore_cursor_events(true).unwrap_or(());

        IS_DRAWER_OPEN.store(false, Ordering::Relaxed);
        IS_ANIMATING.store(false, Ordering::Relaxed);
    });
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn get_app_icon(path: String) -> Result<String, String> {
    #[cfg(target_os = "macos")]
    unsafe {
        use cocoa::base::{id, nil};
        use cocoa::foundation::NSString;
        use objc::{class, msg_send, sel, sel_impl};

        // Perform icon extraction and conversion
        // Note: While Cocoa UI usually needs main thread, icon extraction often works on background.
        // If this causes issues, we might need to dispatch to main thread for specific calls.
        
        let workspace: id = msg_send![class!(NSWorkspace), sharedWorkspace];
        let path_ns = NSString::alloc(nil).init_str(&path);
        let icon: id = msg_send![workspace, iconForFile: path_ns];
        let _: () = msg_send![path_ns, release];

        if icon == nil {
            return Err("Failed to load icon".to_string());
        }

        // Convert to TIFF
        let tiff_data: id = msg_send![icon, TIFFRepresentation];

        // Convert to BitmapRep
        let bitmap_rep: id = msg_send![class!(NSBitmapImageRep), imageRepWithData: tiff_data];

        // Convert to PNG
        // NSPNGFileType = 4
        let png_data: id = msg_send![bitmap_rep, representationUsingType: 4 properties: nil];

        if png_data == nil {
            return Err("Failed to convert to PNG".to_string());
        }

        let length: usize = msg_send![png_data, length];
        let bytes: *const u8 = msg_send![png_data, bytes];
        let slice = std::slice::from_raw_parts(bytes, length);

        let base64 = BASE64_STANDARD.encode(slice);
        Ok(format!("data:image/png;base64,{}", base64))
    }

    #[cfg(not(target_os = "macos"))]
    {
        Err("Not supported on this OS".to_string())
    }
}

#[tauri::command]
fn launch_app(path: &str) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(path)
            .spawn()
            .map_err(|e| e.to_string())?;
        Ok(())
    }
    #[cfg(not(target_os = "macos"))]
    {
        Err("Not supported".to_string())
    }
}

#[tauri::command]
fn get_windows() -> Vec<WindowInfo> {
    let pid = std::process::id() as i32;
    get_open_windows(pid)
}

#[tauri::command]
fn restore_layout(windows: Vec<WindowInfo>) {
    let pid = std::process::id() as i32;
    restore_windows(windows, pid);
}

#[tauri::command]
fn snap_active_window(direction: String) {
    let pid = std::process::id() as i32;
    layout_manager::snap_active_window(direction, pid);
}

#[tauri::command]
fn apply_preset_layout(layout: String) {
    let pid = std::process::id() as i32;
    layout_manager::apply_preset_layout(layout, pid);
}

#[tauri::command]
fn check_accessibility_permission() -> bool {
    #[cfg(target_os = "macos")]
    unsafe {
        // Some systems might cache the result. Using WithOptions with empty dictionary
        // can sometimes force a refresh, but AXIsProcessTrusted is standard.
        // However, if the user toggles it, we want to know immediately.
        // Let's stick to the standard call, but ensure we aren't using the WithOptions call that prompts.
        let trusted = accessibility_sys::AXIsProcessTrusted();
        trusted
    }
    #[cfg(not(target_os = "macos"))]
    {
        true
    }
}

#[tauri::command]
fn request_accessibility_permission() {
    #[cfg(target_os = "macos")]
    unsafe {
        let options = core_foundation::dictionary::CFDictionary::from_CFType_pairs(&[(
            core_foundation::string::CFString::new("AXTrustedCheckOptionPrompt"),
            core_foundation::boolean::CFBoolean::true_value(),
        )]);
        accessibility_sys::AXIsProcessTrustedWithOptions(options.as_concrete_TypeRef());
    }
}

#[tauri::command]
async fn fetch_webpage(url: String) -> Result<String, String> {
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
        .build()
        .map_err(|e| e.to_string())?;

    let resp = client.get(&url).send().await.map_err(|e| e.to_string())?;

    let html = resp.text().await.map_err(|e| e.to_string())?;

    // Sanitize and convert to text
    let text = html2text::from_read(html.as_bytes(), 80).map_err(|e| e.to_string())?;

    Ok(text)
}

#[tauri::command]
fn set_ignore_mouse_events(ignore: bool, window: tauri::Window) {
    window.set_ignore_cursor_events(ignore).unwrap_or(());
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_initial_tables",
            sql: "
                CREATE TABLE IF NOT EXISTS conversations (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    metadata TEXT
                );
                CREATE TABLE IF NOT EXISTS messages (
                    id TEXT PRIMARY KEY,
                    conversation_id TEXT NOT NULL,
                    role TEXT NOT NULL,
                    content TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    metadata TEXT,
                    FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
                );
                CREATE TABLE IF NOT EXISTS clipboard (
                    id TEXT PRIMARY KEY,
                    content TEXT NOT NULL,
                    source_app TEXT,
                    timestamp TEXT NOT NULL,
                    character_count INTEGER,
                    pinned BOOLEAN DEFAULT 0
                );
                CREATE TABLE IF NOT EXISTS window_layouts (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT,
                    layout_data TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS scraping_history (
                    id TEXT PRIMARY KEY,
                    url TEXT NOT NULL,
                    prompt TEXT,
                    result TEXT,
                    status TEXT,
                    created_at TEXT NOT NULL,
                    completed_at TEXT
                );
            ",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "ensure_all_tables",
            sql: "
                CREATE TABLE IF NOT EXISTS window_layouts (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT,
                    layout_data TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS scraping_history (
                    id TEXT PRIMARY KEY,
                    url TEXT NOT NULL,
                    prompt TEXT,
                    result TEXT,
                    status TEXT,
                    created_at TEXT NOT NULL,
                    completed_at TEXT
                );
            ",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "create_web_history",
            sql: "
                CREATE TABLE IF NOT EXISTS web_history (
                    id TEXT PRIMARY KEY,
                    url TEXT NOT NULL,
                    title TEXT,
                    timestamp TEXT NOT NULL
                );
            ",
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .on_menu_event(|app, event| {
             match event.id().as_ref() {
                 "new_tab" => { let _ = app.emit("web-blanket-new-tab", ()); }
                 "close_tab" => { let _ = app.emit("web-blanket-close-tab", ()); }
                 "focus_url" => { let _ = app.emit("web-blanket-focus-url", ()); }
                 "switch_tab_1" => { let _ = app.emit("web-blanket-switch-tab", serde_json::json!({ "index": 0 })); }
                 "switch_tab_2" => { let _ = app.emit("web-blanket-switch-tab", serde_json::json!({ "index": 1 })); }
                 "switch_tab_3" => { let _ = app.emit("web-blanket-switch-tab", serde_json::json!({ "index": 2 })); }
                 "switch_tab_4" => { let _ = app.emit("web-blanket-switch-tab", serde_json::json!({ "index": 3 })); }
                 "switch_tab_5" => { let _ = app.emit("web-blanket-switch-tab", serde_json::json!({ "index": 4 })); }
                 "switch_tab_6" => { let _ = app.emit("web-blanket-switch-tab", serde_json::json!({ "index": 5 })); }
                 "switch_tab_7" => { let _ = app.emit("web-blanket-switch-tab", serde_json::json!({ "index": 6 })); }
                 "switch_tab_8" => { let _ = app.emit("web-blanket-switch-tab", serde_json::json!({ "index": 7 })); }
                 "switch_tab_last" => { let _ = app.emit("web-blanket-switch-tab", serde_json::json!({ "index": "last" })); }
                 _ => {}
             }
        })
        .setup(|app| {
            app.manage(web_blanket::WebBlanketState::new());
            let window = app.get_webview_window("main").unwrap();

            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            // --- Menu Setup ---
            let app_menu = Submenu::with_items(app, "App", true, &[
                &PredefinedMenuItem::about(app, None, None)?,
                &PredefinedMenuItem::separator(app)?,
                &PredefinedMenuItem::services(app, None)?,
                &PredefinedMenuItem::separator(app)?,
                &PredefinedMenuItem::hide(app, None)?,
                &PredefinedMenuItem::hide_others(app, None)?,
                &PredefinedMenuItem::show_all(app, None)?,
                &PredefinedMenuItem::separator(app)?,
                &PredefinedMenuItem::quit(app, None)?,
            ])?;

            let new_tab_i = MenuItem::with_id(app, "new_tab", "New Tab", true, Some("CmdOrCtrl+T"))?;
            let close_tab_i = MenuItem::with_id(app, "close_tab", "Close Tab", true, Some("CmdOrCtrl+W"))?;

            let file_menu = Submenu::with_items(app, "File", true, &[
                &new_tab_i,
                &close_tab_i,
            ])?;

            let edit_menu = Submenu::with_items(app, "Edit", true, &[
                &PredefinedMenuItem::undo(app, None)?,
                &PredefinedMenuItem::redo(app, None)?,
                &PredefinedMenuItem::separator(app)?,
                &PredefinedMenuItem::cut(app, None)?,
                &PredefinedMenuItem::copy(app, None)?,
                &PredefinedMenuItem::paste(app, None)?,
                &PredefinedMenuItem::select_all(app, None)?,
            ])?;

            let focus_url_i = MenuItem::with_id(app, "focus_url", "Focus Address Bar", true, Some("CmdOrCtrl+L"))?;

            let view_menu = Submenu::with_items(app, "View", true, &[
                &focus_url_i,
                &PredefinedMenuItem::fullscreen(app, None)?,
            ])?;

            let window_menu = Submenu::with_items(app, "Window", true, &[
                &PredefinedMenuItem::minimize(app, None)?,
                &PredefinedMenuItem::separator(app)?,
                &MenuItem::with_id(app, "switch_tab_1", "Switch to Tab 1", true, Some("CmdOrCtrl+1"))?,
                &MenuItem::with_id(app, "switch_tab_2", "Switch to Tab 2", true, Some("CmdOrCtrl+2"))?,
                &MenuItem::with_id(app, "switch_tab_3", "Switch to Tab 3", true, Some("CmdOrCtrl+3"))?,
                &MenuItem::with_id(app, "switch_tab_4", "Switch to Tab 4", true, Some("CmdOrCtrl+4"))?,
                &MenuItem::with_id(app, "switch_tab_5", "Switch to Tab 5", true, Some("CmdOrCtrl+5"))?,
                &MenuItem::with_id(app, "switch_tab_6", "Switch to Tab 6", true, Some("CmdOrCtrl+6"))?,
                &MenuItem::with_id(app, "switch_tab_7", "Switch to Tab 7", true, Some("CmdOrCtrl+7"))?,
                &MenuItem::with_id(app, "switch_tab_8", "Switch to Tab 8", true, Some("CmdOrCtrl+8"))?,
                &MenuItem::with_id(app, "switch_tab_last", "Switch to Last Tab", true, Some("CmdOrCtrl+9"))?,
                &PredefinedMenuItem::separator(app)?,
                &PredefinedMenuItem::close_window(app, None)?,
            ])?;

            let menu = Menu::with_items(app, &[
                &app_menu,
                &file_menu,
                &edit_menu,
                &view_menu,
                &window_menu,
            ])?;
            
            app.set_menu(menu)?;
            // ------------------

            let tray_menu = Menu::with_items(app, &[
                &MenuItem::with_id(app, "show", "Show My Drawer", true, None::<&str>)?,
                &MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?,
            ])?;

            let _tray = TrayIconBuilder::new()
                .icon(Image::from_bytes(include_bytes!("../icons/tray.png")).expect("tray icon"))
                .icon_as_template(true)
                .menu(&tray_menu)
                .on_menu_event(|app: &AppHandle, event: MenuEvent| {
                     match event.id().as_ref() {
                         "show" => {
                            if let Some(window) = app.get_webview_window("main") {
                                // Prevent multiple triggers
                                if IS_ANIMATING.load(Ordering::Relaxed) || IS_DRAWER_OPEN.load(Ordering::Relaxed) {
                                    return;
                                }

                                let win_clone = window.clone();
                                std::thread::spawn(move || {
                                    IS_ANIMATING.store(true, Ordering::Relaxed);
                                    
                                    // Move window to visible position
                                    let monitor = win_clone.current_monitor().ok().flatten().or_else(|| win_clone.primary_monitor().ok().flatten());
                                    if let Some(monitor) = monitor {
                                        let scale_factor = monitor.scale_factor();
                                        let screen_size = monitor.size();
                                        let screen_width = screen_size.width as f64;
                                        let screen_height = screen_size.height as f64;
                                        
                                        let width = 400.0 * scale_factor;
                                        let height = 800.0 * scale_factor;
                                        
                                        let active_side = LAST_ACTIVE_SIDE.load(Ordering::Relaxed);
                                        
                                        // Calculate start (offscreen) and end (onscreen) positions
                                        let (start_x, end_x) = if active_side == 1 {
                                            // Right Side
                                            (screen_width as i32, (screen_width - width - 20.0 * scale_factor) as i32)
                                        } else {
                                            // Left Side
                                            (-width as i32, (20.0 * scale_factor) as i32)
                                        };
                                        
                                        let center_y = ((screen_height - height) / 2.0) as i32;
                                        
                                        // Set initial position off-screen
                                        win_clone.set_position(PhysicalPosition::new(start_x, center_y)).unwrap_or(());
                                        win_clone.set_ignore_cursor_events(false).unwrap_or(());
                                        win_clone.show().unwrap();
                                        win_clone.set_focus().unwrap();

                                        // Animate
                                        let duration_ms = 200;
                                        let steps = 20;
                                        let step_delay = duration_ms / steps;

                                        for i in 0..=steps {
                                            let t = i as f64 / steps as f64;
                                            // Ease out cubic
                                            let eased_t = 1.0 - (1.0 - t).powi(3);
                                            let current_x = (start_x as f64 + (end_x as f64 - start_x as f64) * eased_t) as i32;
                                            
                                            win_clone.set_position(PhysicalPosition::new(current_x, center_y)).unwrap_or(());
                                            std::thread::sleep(Duration::from_millis(step_delay));
                                        }
                                        
                                        // Ensure final position
                                        win_clone.set_position(PhysicalPosition::new(end_x, center_y)).unwrap_or(());
                                    }
                                    
                                    IS_DRAWER_OPEN.store(true, Ordering::Relaxed);
                                    IS_ANIMATING.store(false, Ordering::Relaxed);
                                });
                            }
                         }
                         "quit" => {
                             app.exit(0);
                         }
                         _ => {}
                     }
                })
                .build(app)?;

            // Start Clipboard Monitor (Rust Background Thread)
            start_clipboard_monitor(app.handle().clone());

            #[cfg(target_os = "macos")]
            {
                apply_macos_window_customizations(&window);
            }

            // Start Mouse Polling Thread
            let handle = app.handle().clone();
            std::thread::spawn(move || {
                loop {
                    // Check mouse position using CoreGraphics
                    if let Ok(event) = CGEvent::new(
                        CGEventSource::new(CGEventSourceStateID::HIDSystemState).unwrap(),
                    ) {
                        let point = event.location();
                        
                        // Get screen dimensions locally to be responsive
                        let display_id = unsafe { CGDisplay::main().id };
                        let display = CGDisplay::new(display_id);
                        let bounds = display.bounds();
                        let screen_width = bounds.size.width;
                        let screen_height = bounds.size.height;

                        let config = DRAWER_CONFIG.load(Ordering::Relaxed);
                        let mut should_trigger = false;
                        let mut trigger_side = 0; // 0=Left, 1=Right

                        match config {
                            0 => { // Left Only
                                if point.x < 5.0 {
                                    should_trigger = true;
                                    trigger_side = 0;
                                }
                            },
                            1 => { // Right Only
                                if point.x > screen_width - 5.0 {
                                    should_trigger = true;
                                    trigger_side = 1;
                                }
                            },
                            2 => { // Hot Corners
                                // Top-Left or Bottom-Left -> Left Side
                                if point.x < 5.0 && (point.y < 50.0 || point.y > screen_height - 50.0) {
                                    should_trigger = true;
                                    trigger_side = 0;
                                }
                                // Top-Right or Bottom-Right -> Right Side
                                else if point.x > screen_width - 5.0 && (point.y < 50.0 || point.y > screen_height - 50.0) {
                                    should_trigger = true;
                                    trigger_side = 1;
                                }
                            },
                            3 => { // Top-Left Only
                                if point.x < 5.0 && point.y < 50.0 {
                                    should_trigger = true;
                                    trigger_side = 0;
                                }
                            },
                            4 => { // Bottom-Left Only
                                if point.x < 5.0 && point.y > screen_height - 50.0 {
                                    should_trigger = true;
                                    trigger_side = 0;
                                }
                            },
                            5 => { // Top-Right Only
                                if point.x > screen_width - 5.0 && point.y < 50.0 {
                                    should_trigger = true;
                                    trigger_side = 1;
                                }
                            },
                            6 => { // Bottom-Right Only
                                if point.x > screen_width - 5.0 && point.y > screen_height - 50.0 {
                                    should_trigger = true;
                                    trigger_side = 1;
                                }
                            },
                            _ => {}
                        }

                        // Trigger if condition met AND drawer is closed AND not animating
                        if should_trigger
                            && !IS_DRAWER_OPEN.load(Ordering::Relaxed)
                            && !IS_ANIMATING.load(Ordering::Relaxed)
                        {
                            LAST_ACTIVE_SIDE.store(trigger_side, Ordering::Relaxed);
                            
                            if let Some(window) = handle.get_webview_window("main") {
                                IS_ANIMATING.store(true, Ordering::Relaxed);
                                let win_clone = window.clone();

                                std::thread::spawn(move || {
                                    // Disable click-through before showing
                                    win_clone.set_ignore_cursor_events(false).unwrap_or(());

                                    // Show window before animating
                                    win_clone.show().unwrap_or(());
                                    win_clone.set_focus().unwrap_or(());

                                    let monitor = win_clone
                                        .current_monitor()
                                        .ok()
                                        .flatten()
                                        .or_else(|| win_clone.primary_monitor().ok().flatten());
                                    let scale_factor =
                                        monitor.as_ref().map(|m| m.scale_factor()).unwrap_or(2.0);
                                    let screen_height =
                                        monitor.as_ref().map(|m| m.size().height).unwrap_or(2160);
                                    let screen_width =
                                        monitor.as_ref().map(|m| m.size().width).unwrap_or(3840) as f64;

                                    let width = 400.0 * scale_factor;
                                    let height = 800.0 * scale_factor; // Window height from config
                                    
                                    // Determine animation start/end based on trigger_side
                                    let (start_x, end_x) = if trigger_side == 1 {
                                        // Right Side
                                        // Start: screen_width (offscreen right)
                                        // End: screen_width - width - 30 (visible)
                                        (screen_width as i32, (screen_width - width - 20.0 * scale_factor) as i32)
                                    } else {
                                        // Left Side
                                        // Start: -width (offscreen left)
                                        // End: 30 (visible)
                                        (-width as i32, (20.0 * scale_factor) as i32)
                                    };

                                    let center_y = ((screen_height as f64 - height) / 2.0) as i32;

                                    let duration_ms = 200;
                                    let steps = 20;
                                    let step_delay = duration_ms / steps;

                                    for i in 0..=steps {
                                        let t = i as f64 / steps as f64;
                                        // Ease out cubic
                                        let eased_t = 1.0 - (1.0 - t).powi(3);
                                        let current_x = (start_x as f64
                                            + (end_x as f64 - start_x as f64) * eased_t)
                                            as i32;

                                        win_clone
                                            .set_position(PhysicalPosition::new(
                                                current_x, center_y,
                                            ))
                                            .unwrap_or(());
                                        std::thread::sleep(Duration::from_millis(step_delay));
                                    }

                                    win_clone
                                        .set_position(PhysicalPosition::new(end_x, center_y))
                                        .unwrap_or(());

                                    IS_DRAWER_OPEN.store(true, Ordering::Relaxed);
                                    IS_ANIMATING.store(false, Ordering::Relaxed);
                                });
                            }
                        }
                    }
                    std::thread::sleep(Duration::from_millis(50));
                }
            });

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:mydrawer.db", migrations)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            greet,
            get_app_icon,
            launch_app,
            get_windows,
            restore_layout,
            snap_active_window,
            apply_preset_layout,
            check_accessibility_permission,
            request_accessibility_permission,
            fetch_webpage,
            set_ignore_mouse_events,
            hide_drawer,
            set_drawer_config,
            web_blanket::web_blanket_show,
            web_blanket::web_blanket_hide,
            web_blanket::web_blanket_set_bounds,
            web_blanket::web_blanket_tab_create,
            web_blanket::web_blanket_tab_activate,
            web_blanket::web_blanket_tab_close,
            web_blanket::web_blanket_navigate,
            web_blanket::web_blanket_go_back,
            web_blanket::web_blanket_go_forward,
            web_blanket::web_blanket_reload,
            web_blanket::web_blanket_reload_tab,
            web_blanket::web_blanket_stop_loading,
            web_blanket::web_blanket_get_tab_state,
            web_blanket::web_blanket_zoom_in,
            web_blanket::web_blanket_zoom_out,
            web_blanket::web_blanket_set_theme,
            web_blanket::web_blanket_set_user_agent,
            web_blanket::web_blanket_set_muted
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(target_os = "macos")]
fn apply_macos_window_customizations(window: &tauri::WebviewWindow) {
    use cocoa::appkit::{NSView, NSWindow};
    use cocoa::base::{id, nil};
    use objc::{class, msg_send, sel, sel_impl};

    let ns_window = window.ns_window().unwrap() as id;
    unsafe {
        let content_view = ns_window.contentView();
        let _: () = msg_send![content_view, setWantsLayer: true];
        let layer = content_view.layer();
        let _: () = msg_send![layer, setCornerRadius: 16.0_f64];
        let _: () = msg_send![layer, setMasksToBounds: true];
        let _: () = msg_send![ns_window, setOpaque: false];
        let clear_color: id = msg_send![class!(NSColor), clearColor];
        let _: () = msg_send![ns_window, setBackgroundColor: clear_color];
        let _: () = msg_send![ns_window, setHasShadow: false];
        // Initially ignore mouse events so user can click through
        let _: () = msg_send![ns_window, setIgnoresMouseEvents: true];
        // Ensure it floats above
        let _: () = msg_send![ns_window, setLevel: 5]; // kCGFloatingWindowLevel
                                                       // Allow joining all spaces (desktops)
        let _: () = msg_send![ns_window, setCollectionBehavior: 1]; // NSWindowCollectionBehaviorCanJoinAllSpaces
    }
}
