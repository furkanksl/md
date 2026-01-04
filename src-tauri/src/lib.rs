use tauri_plugin_sql::{Migration, MigrationKind};
use tauri::Manager;
use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
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
        }
    ];

    tauri::Builder::default()
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();

            #[cfg(target_os = "macos")]
            {
                apply_vibrancy(&window, NSVisualEffectMaterial::HudWindow, None, Some(16.0))
                    .expect("Unsupported platform! 'apply_vibrancy' is only supported on macOS");
                
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
        .invoke_handler(tauri::generate_handler![greet])
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
        let _: () = msg_send![ns_window, setHasShadow: true];
    }
}