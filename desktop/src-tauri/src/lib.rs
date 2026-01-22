pub mod layout_manager;

use base64::prelude::*;
use core_foundation::base::TCFType;
use core_graphics::event::CGEvent;
use core_graphics::event_source::{CGEventSource, CGEventSourceStateID};
use layout_manager::{get_open_windows, restore_windows, WindowInfo};
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;
use tauri::{Emitter, Manager, PhysicalPosition};
use tauri_plugin_sql::{Migration, MigrationKind};
use arboard::Clipboard;
use sqlx::sqlite::SqlitePoolOptions;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

static IS_DRAWER_OPEN: AtomicBool = AtomicBool::new(false);
static IS_ANIMATING: AtomicBool = AtomicBool::new(false);

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

            let mut last_content = String::new();

            loop {
                let current_text = clipboard.get_text().unwrap_or_default();
                
                if !current_text.trim().is_empty() && current_text != last_content {
                    last_content = current_text.clone();
                    
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
                        
                    let _ = app_handle.emit("clipboard-changed", ());
                }
                
                tokio::time::sleep(Duration::from_secs(1)).await;
            }
        });
    });
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

        let width = 400.0 * scale_factor;
        let height = 800.0 * scale_factor;

        let start_x = 0;
        let end_x = -width as i32;
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
fn get_app_icon(path: String) -> Result<String, String> {
    #[cfg(target_os = "macos")]
    unsafe {
        use cocoa::base::{id, nil};
        use cocoa::foundation::NSString;
        use objc::{class, msg_send, sel, sel_impl};

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
    ];

    tauri::Builder::default()
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();

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

                        // Trigger if mouse is at the left edge AND drawer is closed AND not animating
                        if point.x < 5.0
                            && !IS_DRAWER_OPEN.load(Ordering::Relaxed)
                            && !IS_ANIMATING.load(Ordering::Relaxed)
                        {
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

                                    let width = 400.0 * scale_factor;
                                    let height = 800.0 * scale_factor; // Window height from config

                                    let start_x = -width as i32;
                                    let end_x = 30; // 30px offset for floating effect
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
            hide_drawer
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
