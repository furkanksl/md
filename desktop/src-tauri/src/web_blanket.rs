use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Manager, Runtime, WebviewWindow};

#[cfg(target_os = "macos")]
use cocoa::base::{id, nil};
#[cfg(target_os = "macos")]
use cocoa::foundation::{NSRect, NSPoint, NSSize, NSString};
#[cfg(target_os = "macos")]
use objc::{class, msg_send, sel, sel_impl};
#[cfg(target_os = "macos")]
use objc::runtime::{Object, Sel};

const DESKTOP_USER_AGENT: &str = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15";
const MOBILE_USER_AGENT: &str = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";

const WHATSAPP_SCRIPT: &str = r#"
(function() {
    if (!window.location.host.includes('whatsapp.com')) return;
    const BTN_ID = 'gemini-wa-toggle';
    
    // Inject Styles
    if (!document.getElementById('gemini-wa-style')) {
         const style = document.createElement('style');
         style.id = 'gemini-wa-style';
         style.innerHTML = `
            * { border-inline-start-width: 0px !important; }
            
            /* Hide sidebar wrapper when closed */
            body.gemini-sidebar-closed :has(> #side) {
                display: none !important;
            }
            
            /* Fix main width when sidebar is closed */
            body.gemini-sidebar-closed :has(> #main) {
                max-width: calc(100vw - 64px) !important;
            }
         `;
         document.head.appendChild(style);
    }

    setInterval(() => {
        if (document.getElementById(BTN_ID)) return;
        
        const firstNavItem = document.querySelector('[data-navbar-item]');
        if (!firstNavItem) return;
        
        // Target: parent -> parent -> parent
        const targetContainer = firstNavItem.parentElement?.parentElement?.parentElement;
        if (!targetContainer) return;

        const btn = document.createElement('div');
        btn.id = BTN_ID;
        btn.innerHTML = '<div role="button" title="Toggle Sidebar" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;"><svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"></path></svg></div>';
        
        btn.style.cssText = 'height: 40px; width: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; border-radius: 50%; transition: background-color 0.2s; margin: 0 auto; margin-bottom: 8px; color: var(--icon, #54656f); z-index: 1000;';
        
        btn.onmouseenter = () => btn.style.backgroundColor = 'var(--background-default-hover, rgba(0,0,0,0.05))';
        btn.onmouseleave = () => btn.style.backgroundColor = 'transparent';

        btn.onclick = () => {
            document.body.classList.toggle('gemini-sidebar-closed');
            window.dispatchEvent(new Event('resize'));
        };
        
        targetContainer.insertBefore(btn, targetContainer.firstChild);

    }, 1000);
})();
"#;

// Wrapper for Objective-C pointers to be Send + Sync
#[derive(Clone, Copy, Debug)]
struct SafeId(pub *mut Object);

unsafe impl Send for SafeId {}
unsafe impl Sync for SafeId {}

impl From<id> for SafeId {
    fn from(p: id) -> Self {
        Self(p)
    }
}

impl SafeId {
    fn as_id(&self) -> id {
        self.0
    }
}

pub struct WebBlanketState {
    inner: Mutex<WebBlanketInner>,
}

struct WebBlanketInner {
    // Container view hosting all WKWebViews
    container_view: Option<SafeId>,
    // Map of tab_id -> WKWebView
    tabs: HashMap<String, SafeId>,
    active_tab_id: Option<String>,
    // Last bounds set by frontend
    last_bounds: Option<Bounds>,
}

#[derive(Clone, Copy, Debug)]
struct Bounds {
    x: f64,
    y: f64,
    width: f64,
    height: f64,
    viewport_height: f64,
    device_pixel_ratio: f64,
}

impl WebBlanketState {
    pub fn new() -> Self {
        Self {
            inner: Mutex::new(WebBlanketInner {
                container_view: None,
                tabs: HashMap::new(),
                active_tab_id: None,
                last_bounds: None,
            }),
        }
    }
}

#[derive(serde::Deserialize, Clone, Copy, Debug)]
pub struct BoundsPayload {
    x: f64,
    y: f64,
    width: f64,
    height: f64,
    viewport_height: f64,
    device_pixel_ratio: f64,
}

impl From<BoundsPayload> for Bounds {
    fn from(p: BoundsPayload) -> Self {
        Self {
            x: p.x,
            y: p.y,
            width: p.width,
            height: p.height,
            viewport_height: p.viewport_height,
            device_pixel_ratio: p.device_pixel_ratio,
        }
    }
}

// -----------------------------------------------------------------------------
// Commands
// -----------------------------------------------------------------------------

#[tauri::command]
pub fn web_blanket_show(
    window: WebviewWindow,
    state: tauri::State<WebBlanketState>,
) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let mut inner = state.inner.lock().map_err(|e| e.to_string())?;
        ensure_container(&window, &mut inner)?;
        
        if let Some(container) = inner.container_view {
            unsafe {
                let _: () = msg_send![container.as_id(), setHidden: false];
            }
        }
        Ok(())
    }
    #[cfg(not(target_os = "macos"))]
    Err("Not supported on this OS".into())
}

#[tauri::command]
pub fn web_blanket_hide(
    window: WebviewWindow,
    state: tauri::State<WebBlanketState>,
) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let inner = state.inner.lock().map_err(|e| e.to_string())?;
        if let Some(container) = inner.container_view {
            unsafe {
                let _: () = msg_send![container.as_id(), setHidden: true];
            }
        }
        Ok(())
    }
    #[cfg(not(target_os = "macos"))]
    Err("Not supported on this OS".into())
}

#[tauri::command]
pub fn web_blanket_set_bounds(
    window: WebviewWindow,
    state: tauri::State<WebBlanketState>,
    bounds: BoundsPayload,
) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let mut inner = state.inner.lock().map_err(|e| e.to_string())?;
        let b: Bounds = bounds.into();
        inner.last_bounds = Some(b);
        
        ensure_container(&window, &mut inner)?;
        
        if let Some(container) = inner.container_view {
            update_view_frame(container.as_id(), &b);
            // Also need to update all webviews frame if they don't autoresize?
            // Usually we set autoresizing mask.
        }
        Ok(())
    }
    #[cfg(not(target_os = "macos"))]
    Err("Not supported on this OS".into())
}

#[tauri::command]
pub fn web_blanket_tab_create(
    window: WebviewWindow,
    state: tauri::State<WebBlanketState>,
    tab_id: String,
    url: Option<String>,
) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let mut inner = state.inner.lock().map_err(|e| e.to_string())?;
        
        if inner.tabs.contains_key(&tab_id) {
            return Ok(());
        }

        ensure_container(&window, &mut inner)?;

        let container = inner.container_view
            .ok_or("Container view not initialized")?
            .as_id();
        
        // Create WKWebView
        unsafe {
            let config: id = msg_send![class!(WKWebViewConfiguration), new];

            // Inject WhatsApp Script
            let script_source = NSString::alloc(nil).init_str(WHATSAPP_SCRIPT);
            let user_content_controller: id = msg_send![config, userContentController];
            let user_script: id = msg_send![class!(WKUserScript), alloc];
            let _: () = msg_send![user_script, initWithSource:script_source injectionTime:1isize forMainFrameOnly:false];
            let _: () = msg_send![user_content_controller, addUserScript: user_script];
            let _: () = msg_send![user_script, release];
            let _: () = msg_send![script_source, release];
            
            // Enforce Mobile Content Mode
            let prefs: id = msg_send![config, defaultWebpagePreferences];
            let _: () = msg_send![prefs, setPreferredContentMode: 1isize];

            // Enable Web Inspector
            let preferences: id = msg_send![config, preferences];
            let key = NSString::alloc(nil).init_str("developerExtrasEnabled");
            let val: id = msg_send![class!(NSNumber), numberWithBool: true];
            let _: () = msg_send![preferences, setValue:val forKey:key];
            let _: () = msg_send![key, release];

            let webview: id = msg_send![class!(WKWebView), alloc];
            let webview: id = msg_send![webview, initWithFrame: NSRect::new(NSPoint::new(0., 0.), NSSize::new(0., 0.)) configuration: config];
            
            // Set autoresizing mask to resize with container
            // NSViewWidthSizable | NSViewHeightSizable = 18
            let _: () = msg_send![webview, setAutoresizingMask: 18];
            
            // Add to container but hide it initially
            let _: () = msg_send![container, addSubview: webview];
            let _: () = msg_send![webview, setHidden: true];
            
            // If we have bounds, set frame (though autoresizing might handle it if container has frame)
            // But better to set it once to match container bounds (0,0, width, height)
            let container_bounds: NSRect = msg_send![container, bounds];
            let _: () = msg_send![webview, setFrame: container_bounds];

            // Set Mobile User Agent
            let user_agent = NSString::alloc(nil).init_str(MOBILE_USER_AGENT);
            let _: () = msg_send![webview, setCustomUserAgent: user_agent];
            let _: () = msg_send![user_agent, release];

            // Set default zoom to 80%
            let _: () = msg_send![webview, setPageZoom: 0.8];

            // Store in map
            inner.tabs.insert(tab_id.clone(), SafeId(webview));
            
            // If url provided, load it
            if let Some(u) = url {
                load_url(webview, &u);
            }
            
            // TODO: Implement WKNavigationDelegate or Polling Timer here to emit events:
            // - web-blanket:navigation (url, canGoBack, canGoForward, isLoading)
            // - web-blanket:title
        }
        
        Ok(())
    }
    #[cfg(not(target_os = "macos"))]
    Err("Not supported on this OS".into())
}

#[tauri::command]
pub fn web_blanket_tab_activate(
    _window: WebviewWindow,
    state: tauri::State<WebBlanketState>,
    tab_id: String,
) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let mut inner = state.inner.lock().map_err(|e| e.to_string())?;
        
        // Hide current active tab
        if let Some(current_id) = &inner.active_tab_id {
            if let Some(webview) = inner.tabs.get(current_id) {
                unsafe {
                    let _: () = msg_send![webview.as_id(), setHidden: true];
                }
            }
        }
        
        // Show new tab
        if let Some(webview) = inner.tabs.get(&tab_id) {
            unsafe {
                let _: () = msg_send![webview.as_id(), setHidden: false];
            }
            inner.active_tab_id = Some(tab_id);
        } else {
            return Err("Tab not found".into());
        }
        
        Ok(())
    }
    #[cfg(not(target_os = "macos"))]
    Err("Not supported on this OS".into())
}

#[tauri::command]
pub fn web_blanket_tab_close(
    _window: WebviewWindow,
    state: tauri::State<WebBlanketState>,
    tab_id: String,
) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let mut inner = state.inner.lock().map_err(|e| e.to_string())?;
        
        if let Some(webview) = inner.tabs.remove(&tab_id) {
            unsafe {
                let wv = webview.as_id();
                
                // Pause all media explicitly (fire and forget)
                let script = NSString::alloc(nil).init_str("document.querySelectorAll('video, audio').forEach(e => e.pause());");
                let _: () = msg_send![wv, evaluateJavaScript:script completionHandler:nil];
                let _: () = msg_send![script, release];

                // Stop loading and navigate away to kill media
                let _: () = msg_send![wv, stopLoading];
                load_url(wv, "about:blank");
                
                let _: () = msg_send![wv, removeFromSuperview];
                // We own the reference from alloc, so we must release it
                let _: () = msg_send![wv, release];
            }
            
            if inner.active_tab_id.as_ref() == Some(&tab_id) {
                inner.active_tab_id = None;
            }
        }
        
        Ok(())
    }
    #[cfg(not(target_os = "macos"))]
    Err("Not supported on this OS".into())
}

#[tauri::command]
pub fn web_blanket_navigate(
    _window: WebviewWindow,
    state: tauri::State<WebBlanketState>,
    tab_id: String,
    url: String,
) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let inner = state.inner.lock().map_err(|e| e.to_string())?;
        
        if let Some(webview) = inner.tabs.get(&tab_id) {
            unsafe {
                load_url(webview.as_id(), &url);
            }
        }
        Ok(())
    }
    #[cfg(not(target_os = "macos"))]
    Err("Not supported on this OS".into())
}

#[tauri::command]
pub fn web_blanket_go_back(
    _window: WebviewWindow,
    state: tauri::State<WebBlanketState>,
) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let inner = state.inner.lock().map_err(|e| e.to_string())?;
        if let Some(tid) = &inner.active_tab_id {
            if let Some(webview) = inner.tabs.get(tid) {
                unsafe {
                    let _: () = msg_send![webview.as_id(), goBack];
                }
            }
        }
        Ok(())
    }
    #[cfg(not(target_os = "macos"))]
    Err("Not supported on this OS".into())
}

#[tauri::command]
pub fn web_blanket_go_forward(
    _window: WebviewWindow,
    state: tauri::State<WebBlanketState>,
) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let inner = state.inner.lock().map_err(|e| e.to_string())?;
        if let Some(tid) = &inner.active_tab_id {
            if let Some(webview) = inner.tabs.get(tid) {
                unsafe {
                    let _: () = msg_send![webview.as_id(), goForward];
                }
            }
        }
        Ok(())
    }
    #[cfg(not(target_os = "macos"))]
    Err("Not supported on this OS".into())
}

#[tauri::command]
pub fn web_blanket_reload(
    _window: WebviewWindow,
    state: tauri::State<WebBlanketState>,
) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let inner = state.inner.lock().map_err(|e| e.to_string())?;
        if let Some(tid) = &inner.active_tab_id {
            if let Some(webview) = inner.tabs.get(tid) {
                unsafe {
                    let _: () = msg_send![webview.as_id(), reload];
                }
            }
        }
        Ok(())
    }
    #[cfg(not(target_os = "macos"))]
    Err("Not supported on this OS".into())
}

#[tauri::command]
pub fn web_blanket_stop_loading(
    _window: WebviewWindow,
    state: tauri::State<WebBlanketState>,
) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let inner = state.inner.lock().map_err(|e| e.to_string())?;
        if let Some(tid) = &inner.active_tab_id {
            if let Some(webview) = inner.tabs.get(tid) {
                unsafe {
                    let _: () = msg_send![webview.as_id(), stopLoading];
                }
            }
        }
        Ok(())
    }
    #[cfg(not(target_os = "macos"))]
    Err("Not supported on this OS".into())
}

#[tauri::command]
pub fn web_blanket_set_theme(
    _window: WebviewWindow,
    state: tauri::State<WebBlanketState>,
    theme: String,
) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let inner = state.inner.lock().map_err(|e| e.to_string())?;
        if let Some(container) = inner.container_view {
            unsafe {
                let name = if theme == "dark" {
                    "NSAppearanceNameDarkAqua"
                } else {
                    "NSAppearanceNameAqua"
                };
                let name_str = NSString::alloc(nil).init_str(name);
                let appearance: id = msg_send![class!(NSAppearance), appearanceNamed: name_str];
                
                let _: () = msg_send![container.as_id(), setAppearance: appearance];
                
                // Apply to all tabs
                for webview in inner.tabs.values() {
                    let _: () = msg_send![webview.as_id(), setAppearance: appearance];
                }

                let _: () = msg_send![name_str, release];
            }
        }
        Ok(())
    }
    #[cfg(not(target_os = "macos"))]
    Err("Not supported on this OS".into())
}

#[tauri::command]
pub fn web_blanket_set_user_agent(
    _window: WebviewWindow,
    state: tauri::State<WebBlanketState>,
    tab_id: String,
    mode: String,
) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let inner = state.inner.lock().map_err(|e| e.to_string())?;
        
        if let Some(webview) = inner.tabs.get(&tab_id) {
            unsafe {
                let wv = webview.as_id();
                
                // 1 = Mobile, 2 = Desktop
                let content_mode: isize = if mode == "desktop" { 2 } else { 1 };
                
                // Get configuration -> preferences
                let config: id = msg_send![wv, configuration];
                let prefs: id = msg_send![config, defaultWebpagePreferences];
                let _: () = msg_send![prefs, setPreferredContentMode: content_mode];
                
                let ua_string = if mode == "desktop" {
                    DESKTOP_USER_AGENT
                } else {
                    MOBILE_USER_AGENT
                };
                
                let user_agent = NSString::alloc(nil).init_str(ua_string);
                let _: () = msg_send![wv, setCustomUserAgent: user_agent];
                let _: () = msg_send![user_agent, release];
                
                // Reload to apply
                let _: () = msg_send![wv, reload];
            }
        }
        Ok(())
    }
    #[cfg(not(target_os = "macos"))]
    Err("Not supported on this OS".into())
}

#[tauri::command]
pub fn web_blanket_zoom_in(
    _window: WebviewWindow,
    state: tauri::State<WebBlanketState>,
) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let inner = state.inner.lock().map_err(|e| e.to_string())?;
        if let Some(tid) = &inner.active_tab_id {
            if let Some(webview) = inner.tabs.get(tid) {
                unsafe {
                    let wv = webview.as_id();
                    // CGFloat is f64 on 64-bit macOS
                    let current_zoom: f64 = msg_send![wv, pageZoom];
                    let new_zoom = current_zoom + 0.1;
                    let _: () = msg_send![wv, setPageZoom: new_zoom];
                }
            }
        }
        Ok(())
    }
    #[cfg(not(target_os = "macos"))]
    Err("Not supported on this OS".into())
}

#[tauri::command]
pub fn web_blanket_zoom_out(
    _window: WebviewWindow,
    state: tauri::State<WebBlanketState>,
) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let inner = state.inner.lock().map_err(|e| e.to_string())?;
        if let Some(tid) = &inner.active_tab_id {
            if let Some(webview) = inner.tabs.get(tid) {
                unsafe {
                    let wv = webview.as_id();
                    let current_zoom: f64 = msg_send![wv, pageZoom];
                    let new_zoom = (current_zoom - 0.1).max(0.5);
                    let _: () = msg_send![wv, setPageZoom: new_zoom];
                }
            }
        }
        Ok(())
    }
    #[cfg(not(target_os = "macos"))]
    Err("Not supported on this OS".into())
}

#[derive(serde::Serialize, Clone, Debug)]
pub struct TabStatePayload {
    url: String,
    title: String,
    loading: bool,
    can_go_back: bool,
    can_go_forward: bool,
    current_zoom: f64,
}

// ... existing commands ...

#[tauri::command]
pub fn web_blanket_get_tab_state(
    _window: WebviewWindow,
    state: tauri::State<WebBlanketState>,
    tab_id: String,
) -> Result<TabStatePayload, String> {
    #[cfg(target_os = "macos")]
    {
        let inner = state.inner.lock().map_err(|e| e.to_string())?;
        
        if let Some(webview) = inner.tabs.get(&tab_id) {
            unsafe {
                let wv = webview.as_id();
                
                let title_ns: id = msg_send![wv, title];
                let title = if title_ns != nil {
                    nsstring_to_string(title_ns)
                } else {
                    String::new()
                };

                let url_ns: id = msg_send![wv, URL]; // NSURL
                let url = if url_ns != nil {
                    let abs_str: id = msg_send![url_ns, absoluteString];
                    if abs_str != nil {
                        nsstring_to_string(abs_str)
                    } else {
                        String::new()
                    }
                } else {
                    String::new()
                };

                let loading: bool = msg_send![wv, isLoading];
                let can_go_back: bool = msg_send![wv, canGoBack];
                let can_go_forward: bool = msg_send![wv, canGoForward];
                let current_zoom: f64 = msg_send![wv, pageZoom];

                Ok(TabStatePayload {
                    url,
                    title,
                    loading,
                    can_go_back,
                    can_go_forward,
                    current_zoom,
                })
            }
        } else {
            Err("Tab not found".into())
        }
    }
    #[cfg(not(target_os = "macos"))]
    Err("Not supported on this OS".into())
}

#[cfg(target_os = "macos")]
unsafe fn nsstring_to_string(ns_string: id) -> String {
    let utf8: *const std::ffi::c_char = msg_send![ns_string, UTF8String];
    if utf8.is_null() {
        return String::new();
    }
    let bytes = std::ffi::CStr::from_ptr(utf8).to_bytes();
    String::from_utf8_lossy(bytes).to_string()
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

#[cfg(target_os = "macos")]
fn ensure_container(
    window: &WebviewWindow,
    inner: &mut WebBlanketInner,
) -> Result<(), String> {
    if inner.container_view.is_some() {
        return Ok(());
    }

    unsafe {
        let ns_window = window.ns_window().map_err(|e| e.to_string())? as id;
        let content_view: id = msg_send![ns_window, contentView];
        
        let container: id = msg_send![class!(NSView), alloc];
        let container: id = msg_send![container, initWithFrame: NSRect::new(NSPoint::new(0., 0.), NSSize::new(0., 0.))];
        
        // Styling
        let _: () = msg_send![container, setWantsLayer: true];
        let layer: id = msg_send![container, layer];
        let _: () = msg_send![layer, setCornerRadius: 16.0];
        let _: () = msg_send![layer, setMasksToBounds: true];
        
        // Background color (e.g. white or dark grey depending on theme? Hardcode to white for now or rely on webview bg)
        // Actually, let's make it transparent so if webview is transparent it shows through?
        // But plan said "opaque-ish color".
        // Let's set a default background to avoid transparency issues
        let bg_color: id = msg_send![class!(NSColor), colorWithRed:1.0 green:1.0 blue:1.0 alpha:1.0];
        let cg_color: id = msg_send![bg_color, CGColor];
        let _: () = msg_send![layer, setBackgroundColor: cg_color];
        
        // Hide by default, only show when explicitly requested
        let _: () = msg_send![container, setHidden: true];

        let _: () = msg_send![content_view, addSubview: container];
        
        inner.container_view = Some(SafeId(container));
        
        // If we have last bounds, apply them
        if let Some(bounds) = inner.last_bounds {
            update_view_frame(container, &bounds);
        }
    }

    Ok(())
}

#[cfg(target_os = "macos")]
fn update_view_frame(view: id, bounds: &Bounds) {
    unsafe {
        // Convert coordinates
        // macOS NSView origin is bottom-left.
        // x matches.
        // y needs to be flipped: window_height - (y + height)
        // assuming bounds.y is from top.
        
        let _scale = 1.0; // Usually points if we use logical pixels.
        // bounds from frontend are CSS pixels.
        // NSView frame is in points.
        // If DPR is 2.0, CSS px * DPR = Physical px.
        // NSView expects Points.
        // 1 CSS px usually = 1 Point on macOS.
        // So we might not need to multiply by DPR or divide.
        // Let's assume 1:1 for now (CSS px == Points).
        
        // However, viewport_height is in CSS px.
        
        let height_points = bounds.height;
        let y_points = bounds.viewport_height - (bounds.y + bounds.height);
        
        let rect = NSRect::new(
            NSPoint::new(bounds.x, y_points),
            NSSize::new(bounds.width, height_points)
        );
        
        let _: () = msg_send![view, setFrame: rect];
    }
}

#[cfg(target_os = "macos")]
unsafe fn load_url(webview: id, url: &str) {
    let url_string = NSString::alloc(nil).init_str(url);
    let ns_url: id = msg_send![class!(NSURL), URLWithString: url_string];
    
    if ns_url != nil {
        let request: id = msg_send![class!(NSURLRequest), requestWithURL: ns_url];
        let _: () = msg_send![webview, loadRequest: request];
    }
    
    let _: () = msg_send![url_string, release];
}
