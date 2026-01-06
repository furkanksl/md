use accessibility_sys::{
    kAXErrorSuccess, AXUIElementCopyAttributeValue, AXUIElementCreateApplication,
    AXUIElementSetAttributeValue,
    AXUIElementRef, AXValueRef, AXValueType, AXValueCreate,
};
use core_foundation::base::{TCFType, FromVoid};
use core_foundation::string::{CFString, CFStringRef};
use core_foundation::array::{CFArray, CFArrayRef, CFArrayGetValueAtIndex};
use core_foundation::dictionary::{CFDictionary, CFDictionaryRef};
use core_foundation::number::{CFNumber, CFNumberRef};
use core_graphics::display::{CGDisplay};
use core_graphics::geometry::{CGPoint, CGSize};
use core_graphics::window::{
    CGWindowListCopyWindowInfo, kCGWindowListOptionOnScreenOnly,
    kCGWindowListExcludeDesktopElements, kCGNullWindowID,
};
use serde::{Deserialize, Serialize};
use std::ffi::c_void;
use std::ptr;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WindowRect {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WindowInfo {
    pub id: u32,
    pub pid: i32,
    pub title: String,
    pub app_name: String,
    pub frame: WindowRect,
}

pub fn get_open_windows(my_pid: i32) -> Vec<WindowInfo> {
    let mut windows = Vec::new();

    unsafe {
        let options =
            kCGWindowListOptionOnScreenOnly | kCGWindowListExcludeDesktopElements;
        let window_list_ref = CGWindowListCopyWindowInfo(options, kCGNullWindowID);

        if window_list_ref.is_null() {
            return windows;
        }

        let window_list: CFArray<*const c_void> = CFArray::wrap_under_create_rule(window_list_ref);
        let count = window_list.len();

        for i in 0..count {
            let dict_ref =
                CFArrayGetValueAtIndex(window_list.as_concrete_TypeRef(), i) as CFDictionaryRef;
            let dict = CFDictionary::wrap_under_get_rule(dict_ref);

            let pid = get_number_from_dict(&dict, "kCGWindowOwnerPID").unwrap_or(0) as i32;

            if pid == my_pid {
                continue;
            }

            let layer = get_number_from_dict(&dict, "kCGWindowLayer").unwrap_or(0);
            if layer != 0 {
                continue;
            }

            let app_name = get_string_from_dict(&dict, "kCGWindowOwnerName").unwrap_or_default();
            let title = get_string_from_dict(&dict, "kCGWindowName").unwrap_or_default();

            if app_name == "Dock"
                || app_name == "Window Server"
                || app_name == "Control Center"
                || app_name == "Screenshot"
                || app_name == "Wallpaper"
            {
                continue;
            }

            let id = get_number_from_dict(&dict, "kCGWindowNumber").unwrap_or(0) as u32;

            let bounds_key = CFString::new("kCGWindowBounds");
            let bounds_key_ptr = bounds_key.as_concrete_TypeRef() as *const c_void;
            
            if let Some(bounds_ptr_ref) = dict.find(bounds_key_ptr) {
                let bounds_dict_ref = *bounds_ptr_ref as CFDictionaryRef;
                let bounds_dict = CFDictionary::wrap_under_get_rule(bounds_dict_ref);
                
                let x = get_number_from_dict_float(&bounds_dict, "X").unwrap_or(0.0);
                let y = get_number_from_dict_float(&bounds_dict, "Y").unwrap_or(0.0);
                let width = get_number_from_dict_float(&bounds_dict, "Width").unwrap_or(0.0);
                let height = get_number_from_dict_float(&bounds_dict, "Height").unwrap_or(0.0);

                if width < 100.0 || height < 100.0 {
                    continue;
                }

                windows.push(WindowInfo {
                    id,
                    pid,
                    app_name,
                    title,
                    frame: WindowRect {
                        x,
                        y,
                        width,
                        height,
                    },
                });
            }
        }
    }

    windows
}

pub fn restore_windows(windows: Vec<WindowInfo>, my_pid: i32) {
    let current_windows = get_open_windows(my_pid);

    for saved_win in windows {
        let mut target_pid = saved_win.pid;
        let mut found = false;

        if let Some(curr) = current_windows.iter().find(|w| w.id == saved_win.id) {
            target_pid = curr.pid;
            found = true;
        } else if let Some(curr) = current_windows
            .iter()
            .find(|w| w.app_name == saved_win.app_name && w.title == saved_win.title)
        {
            target_pid = curr.pid;
            found = true;
        } else if let Some(curr) = current_windows
            .iter()
            .find(|w| w.app_name == saved_win.app_name)
        {
            target_pid = curr.pid;
            found = true;
        }

        if found {
            unsafe {
                move_window(target_pid, saved_win.frame);
            }
        }
    }
}

pub fn snap_active_window(direction: String, my_pid: i32) {
    let windows = get_open_windows(my_pid);
    if windows.is_empty() {
        return;
    }

    let target = &windows[0];

    let center = CGPoint {
        x: target.frame.x + target.frame.width / 2.0,
        y: target.frame.y + target.frame.height / 2.0,
    };

    let display_id = unsafe {
        let displays = CGDisplay::active_displays().unwrap_or(vec![CGDisplay::main().id]);
        let mut best_display = displays[0];

        for d_id in displays {
            let d = CGDisplay::new(d_id);
            let b = d.bounds();
            if b.contains(&center) {
                best_display = d_id;
                break;
            }
        }
        best_display
    };

    let display = CGDisplay::new(display_id);
    let bounds = display.bounds();

    let menu_bar_height = 24.0;
    let working_y = bounds.origin.y + menu_bar_height;
    let working_h = bounds.size.height - menu_bar_height;
    let working_w = bounds.size.width;
    let working_x = bounds.origin.x;

    let new_frame = match direction.as_str() {
        "left" => WindowRect {
            x: working_x,
            y: working_y,
            width: working_w / 2.0,
            height: working_h,
        },
        "right" => WindowRect {
            x: working_x + working_w / 2.0,
            y: working_y,
            width: working_w / 2.0,
            height: working_h,
        },
        "top" => WindowRect {
            x: working_x,
            y: working_y,
            width: working_w,
            height: working_h / 2.0,
        },
        "bottom" => WindowRect {
            x: working_x,
            y: working_y + working_h / 2.0,
            width: working_w,
            height: working_h / 2.0,
        },
        "maximize" => WindowRect {
            x: working_x,
            y: working_y,
            width: working_w,
            height: working_h,
        },
        "center" => WindowRect {
            x: working_x + working_w * 0.1,
            y: working_y + working_h * 0.1,
            width: working_w * 0.8,
            height: working_h * 0.8,
        },
        _ => target.frame.clone(),
    };

    unsafe {
        move_window(target.pid, new_frame);
    }
}

pub fn apply_preset_layout(layout_type: String, my_pid: i32) {
    let windows = get_open_windows(my_pid);
    if windows.is_empty() { return; }

    let target = &windows[0];
    let center = CGPoint {
        x: target.frame.x + target.frame.width / 2.0,
        y: target.frame.y + target.frame.height / 2.0,
    };

    let display_id = unsafe {
        let displays = CGDisplay::active_displays().unwrap_or(vec![CGDisplay::main().id]);
        let mut best_display = displays[0];
        
        for d_id in displays {
            let d = CGDisplay::new(d_id);
            let b = d.bounds();
            if b.contains(&center) {
                best_display = d_id;
                break;
            }
        }
        best_display
    };

    let display = CGDisplay::new(display_id);
    let bounds = display.bounds();
    
    let menu_bar_height = 24.0; 
    let working_y = bounds.origin.y + menu_bar_height;
    let working_h = bounds.size.height - menu_bar_height; 
    let working_w = bounds.size.width;
    let working_x = bounds.origin.x;

    match layout_type.as_str() {
        "rows_2" => {
            if windows.len() >= 2 {
                unsafe {
                    move_window(windows[0].pid, WindowRect { x: working_x, y: working_y, width: working_w, height: working_h / 2.0 });
                    move_window(windows[1].pid, WindowRect { x: working_x, y: working_y + working_h / 2.0, width: working_w, height: working_h / 2.0 });
                }
            }
        },
        "rows_3" => {
            if windows.len() >= 3 {
                let h_third = working_h / 3.0;
                unsafe {
                    move_window(windows[0].pid, WindowRect { x: working_x, y: working_y, width: working_w, height: h_third });
                    move_window(windows[1].pid, WindowRect { x: working_x, y: working_y + h_third, width: working_w, height: h_third });
                    move_window(windows[2].pid, WindowRect { x: working_x, y: working_y + h_third * 2.0, width: working_w, height: h_third });
                }
            }
        },
        "columns_2" => {
            if windows.len() >= 2 {
                let w1 = &windows[0];
                let w2 = &windows[1];
                unsafe {
                    move_window(w1.pid, WindowRect { x: working_x, y: working_y, width: working_w / 2.0, height: working_h });
                    move_window(w2.pid, WindowRect { x: working_x + working_w / 2.0, y: working_y, width: working_w / 2.0, height: working_h });
                }
            }
        },
        "columns_3" => {
            if windows.len() >= 3 {
                let w_third = working_w / 3.0;
                unsafe {
                    move_window(windows[0].pid, WindowRect { x: working_x, y: working_y, width: w_third, height: working_h });
                    move_window(windows[1].pid, WindowRect { x: working_x + w_third, y: working_y, width: w_third, height: working_h });
                    move_window(windows[2].pid, WindowRect { x: working_x + w_third * 2.0, y: working_y, width: w_third, height: working_h });
                }
            }
        },
        "grid_4" => {
            if windows.len() >= 4 {
                let half_w = working_w / 2.0;
                let half_h = working_h / 2.0;
                unsafe {
                    move_window(windows[0].pid, WindowRect { x: working_x, y: working_y, width: half_w, height: half_h }); // Top Left
                    move_window(windows[1].pid, WindowRect { x: working_x + half_w, y: working_y, width: half_w, height: half_h }); // Top Right
                    move_window(windows[2].pid, WindowRect { x: working_x, y: working_y + half_h, width: half_w, height: half_h }); // Bottom Left
                    move_window(windows[3].pid, WindowRect { x: working_x + half_w, y: working_y + half_h, width: half_w, height: half_h }); // Bottom Right
                }
            }
        },
        "main_left" => {
            if windows.len() >= 2 {
                let main_w = working_w * 0.6;
                let side_w = working_w * 0.4;
                unsafe {
                    move_window(windows[0].pid, WindowRect { x: working_x, y: working_y, width: main_w, height: working_h });
                    
                    let others = &windows[1..];
                    let stack_count = others.len().min(3);
                    if stack_count > 0 {
                        let stack_h = working_h / stack_count as f64;
                        for (i, w) in others.iter().take(stack_count).enumerate() {
                            move_window(w.pid, WindowRect { 
                                x: working_x + main_w, 
                                y: working_y + (i as f64 * stack_h), 
                                width: side_w, 
                                height: stack_h 
                            });
                        }
                    }
                }
            }
        },
        "cascade" => {
            let offset = 30.0;
            let start_x = working_x + 50.0;
            let start_y = working_y + 50.0;
            let w_width = working_w * 0.6;
            let w_height = working_h * 0.7;
            
            for (i, w) in windows.iter().take(10).enumerate() {
                unsafe {
                    move_window(w.pid, WindowRect {
                        x: start_x + (i as f64 * offset),
                        y: start_y + (i as f64 * offset),
                        width: w_width,
                        height: w_height
                    });
                }
            }
        },
        _ => {}
    }
}

unsafe fn move_window(pid: i32, frame: WindowRect) {
    let app_ref = AXUIElementCreateApplication(pid);
    if app_ref.is_null() {
        return;
    }

    let mut windows_ref: *const c_void = ptr::null();
    let windows_attr = CFString::new("AXWindows");

    let result = AXUIElementCopyAttributeValue(
        app_ref,
        windows_attr.as_concrete_TypeRef(),
        &mut windows_ref,
    );

    if result == kAXErrorSuccess && !windows_ref.is_null() {
        let windows: CFArray<AXUIElementRef> =
            CFArray::wrap_under_create_rule(windows_ref as CFArrayRef);
        let count = windows.len();

        for i in 0..count {
            let window_ref =
                CFArrayGetValueAtIndex(windows.as_concrete_TypeRef(), i) as AXUIElementRef;

            let pos = CGPoint {
                x: frame.x,
                y: frame.y,
            };
            let size = CGSize {
                width: frame.width,
                height: frame.height,
            };

            let pos_val =
                AXValueCreate(1, &pos as *const _ as *const c_void);
            let size_val =
                AXValueCreate(2, &size as *const _ as *const c_void);

            let pos_attr = CFString::new("AXPosition");
            let size_attr = CFString::new("AXSize");

            AXUIElementSetAttributeValue(
                window_ref,
                pos_attr.as_concrete_TypeRef(),
                pos_val as *const c_void,
            );
            AXUIElementSetAttributeValue(
                window_ref,
                size_attr.as_concrete_TypeRef(),
                size_val as *const c_void,
            );

            break;
        }
    }
}

unsafe fn get_number_from_dict(
    dict: &CFDictionary<*const c_void, *const c_void>,
    key: &str,
) -> Option<i64> {
    let key_cf = CFString::new(key);
    let key_ptr = key_cf.as_concrete_TypeRef() as *const c_void;
    
    if let Some(val_ref) = dict.find(key_ptr) {
        let val_ptr: *const c_void = *val_ref;
        if val_ptr.is_null() { return None; }
        let num = CFNumber::wrap_under_get_rule(val_ptr as CFNumberRef);
        num.to_i64()
    } else {
        None
    }
}

unsafe fn get_number_from_dict_float(
    dict: &CFDictionary<*const c_void, *const c_void>,
    key: &str,
) -> Option<f64> {
    let key_cf = CFString::new(key);
    let key_ptr = key_cf.as_concrete_TypeRef() as *const c_void;

    if let Some(val_ref) = dict.find(key_ptr) {
        let val_ptr: *const c_void = *val_ref;
        if val_ptr.is_null() {
            return None;
        }
        let num = CFNumber::wrap_under_get_rule(val_ptr as CFNumberRef);
        num.to_f64()
    } else {
        None
    }
}

unsafe fn get_string_from_dict(
    dict: &CFDictionary<*const c_void, *const c_void>,
    key: &str,
) -> Option<String> {
    let key_cf = CFString::new(key);
    let key_ptr = key_cf.as_concrete_TypeRef() as *const c_void;

    if let Some(val_ref) = dict.find(key_ptr) {
        let val_ptr: *const c_void = *val_ref;
        if val_ptr.is_null() {
            return None;
        }
        let str_ref = CFString::wrap_under_get_rule(val_ptr as CFStringRef);
        Some(str_ref.to_string())
    } else {
        None
    }
}