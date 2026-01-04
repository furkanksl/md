pub mod layout_manager;

use tauri_plugin_sql::{Migration, MigrationKind};
use tauri::Manager;
use core_foundation::base::TCFType;
use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};
use base64::prelude::*;
use layout_manager::{get_open_windows, restore_windows, WindowInfo};

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
        accessibility_sys::AXIsProcessTrusted()
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
        let options = core_foundation::dictionary::CFDictionary::from_CFType_pairs(
            &[(
                core_foundation::string::CFString::new("AXTrustedCheckOptionPrompt"),
                core_foundation::boolean::CFBoolean::true_value(),
            )],
        );
        accessibility_sys::AXIsProcessTrustedWithOptions(options.as_concrete_TypeRef());
    }
}

#[tauri::command]
async fn fetch_webpage(url: String) -> Result<String, String> {
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
        .build()
        .map_err(|e| e.to_string())?;

    let resp = client.get(&url)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let html = resp.text().await.map_err(|e| e.to_string())?;
    
    // Sanitize and convert to text
    let text = html2text::from_read(html.as_bytes(), 80).map_err(|e| e.to_string())?;
    
    Ok(text)
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
        }
    ];

    tauri::Builder::default()
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();

            #[cfg(target_os = "macos")]
            {
                apply_macos_window_customizations(&window);
            }

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_clipboard_manager::init())
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
            fetch_webpage
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
    }
}