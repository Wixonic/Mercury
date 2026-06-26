#[tauri::command]
fn open_captcha_window(
    app: tauri::AppHandle,
    sitekey: String,
    rqdata: Option<String>,
    rqtoken: Option<String>,
    session_id: Option<String>,
    ticket: String,
    app_origin: String,
) -> Result<(), String> {
    let url = tauri::Url::parse("https://discord.com/login").map_err(|e| e.to_string())?;

    // Prepare JS values safely
    let rqdata_js = match rqdata {
        Some(ref d) => format!("\"{}\"", d.replace('"', "\\\"")),
        None => "null".to_string(),
    };
    let rqtoken_js = match rqtoken {
        Some(ref t) => format!("\"{}\"", t.replace('"', "\\\"")),
        None => "null".to_string(),
    };
    let session_id_js = match session_id {
        Some(ref s) => format!("\"{}\"", s.replace('"', "\\\"")),
        None => "null".to_string(),
    };

    let script = format!(
        r##"
        (function() {{
            window.CAPTCHA_SITEKEY = "{}";
            window.CAPTCHA_RQDATA = {};
            window.CAPTCHA_RQTOKEN = {};
            window.CAPTCHA_SESSION_ID = {};
            window.CAPTCHA_TICKET = "{}";
            window.APP_ORIGIN = "{}";

            let initialized = false;
            function init() {{
                if (initialized) return;
                const body = document.body;
                if (!body) return;
                initialized = true;

                // Create a fullscreen overlay to hide the Discord login page underneath
                const overlay = document.createElement("div");
                overlay.id = "mercury-captcha-overlay";
                overlay.style.position = "fixed";
                overlay.style.top = "0";
                overlay.style.left = "0";
                overlay.style.width = "100vw";
                overlay.style.height = "100vh";
                overlay.style.backgroundColor = "#1e1f22";
                overlay.style.zIndex = "999999";
                overlay.style.display = "flex";
                overlay.style.flexDirection = "column";
                overlay.style.alignItems = "center";
                overlay.style.justifyContent = "center";
                overlay.style.gap = "1rem";
                overlay.style.padding = "1.5rem";
                overlay.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
                overlay.style.color = "#f2f3f5";

                overlay.innerHTML = `
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem; text-align: center; width: 100%;">
                        <h1 style="font-size: 1.25rem; font-weight: 600; color: #ffffff; margin-bottom: 0.5rem;">Security Verification</h1>
                        <p style="font-size: 0.875rem; color: #b5bac1; max-width: 280px; line-height: 1.4;">Please complete the captcha to finish logging in to Mercury.</p>
                        <div id="hcaptcha-box"></div>
                        <p id="status" style="font-size: 0.8rem; font-weight: 500; opacity: 0.6; transition: all 0.2s ease;">Loading verification...</p>
                        <div id="debug-log" style="font-family: monospace; font-size: 0.7rem; color: #b5bac1; background: #2b2d31; padding: 0.5rem; border-radius: 4px; max-width: 360px; word-break: break-all; text-align: left; max-height: 150px; overflow-y: auto; margin-top: 1rem; display: none;"></div>
                    </div>
                `;

                body.appendChild(overlay);

                window.onHCaptchaLoad = function() {{
                    const statusEl = document.getElementById("status");
                    const debugEl = document.getElementById("debug-log");
                    if (statusEl) {{
                        statusEl.textContent = "Waiting for verification...";
                    }}
                    
                    const renderOptions = {{
                        sitekey: window.CAPTCHA_SITEKEY,
                        theme: "dark",
                        callback: function(token) {{
                            if (statusEl) {{
                                statusEl.textContent = "Completing login with Discord...";
                            }}
                            
                            // Send the official super properties to match the User-Agent
                            const xSuperProperties = "{}";

                            const headers = {{
                                "content-type": "application/json",
                                "accept": "*/*",
                                "accept-language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
                                "origin": "https://discord.com",
                                "referer": "https://discord.com/login",
                                "x-super-properties": xSuperProperties,
                                "x-captcha-key": token
                            }};
                            
                            if (window.CAPTCHA_RQTOKEN) {{
                                headers["x-captcha-rqtoken"] = window.CAPTCHA_RQTOKEN;
                            }}
                            if (window.CAPTCHA_SESSION_ID) {{
                                headers["x-captcha-session-id"] = window.CAPTCHA_SESSION_ID;
                            }}

                            // Display debug info on screen
                            if (debugEl) {{
                                debugEl.style.display = "block";
                                debugEl.innerHTML = "<b>Sending POST Request:</b><br/>" + 
                                    "<b>Headers:</b> " + JSON.stringify(headers) + "<br/>" +
                                    "<b>Ticket:</b> " + window.CAPTCHA_TICKET;
                            }}

                            fetch("/api/v9/users/@me/remote-auth/login", {{
                                method: "POST",
                                headers: headers,
                                body: JSON.stringify({{ ticket: window.CAPTCHA_TICKET }})
                            }})
                            .then(response => {{
                                return response.json().then(data => {{
                                    if (debugEl) {{
                                        debugEl.innerHTML += "<br/><b>Response (Status " + response.status + "):</b> " + JSON.stringify(data);
                                    }}
                                    if (!response.ok) {{
                                        throw new Error(data.message || JSON.stringify(data));
                                    }}
                                    return data;
                                }});
                            }})
                            .then(data => {{
                                if (statusEl) {{
                                    statusEl.style.color = "#23a55a";
                                    statusEl.style.opacity = "1";
                                    statusEl.textContent = "Verified! Returning to app...";
                                }}
                                // Send the encrypted token back to the main window to be decrypted
                                const callbackUrl = window.APP_ORIGIN + "/?encrypted_token=" + encodeURIComponent(data.encrypted_token);
                                window.location.href = callbackUrl;
                            }})
                            .catch(err => {{
                                console.error("Login failed:", err);
                                if (statusEl) {{
                                    statusEl.style.color = "#f23f43";
                                    statusEl.style.opacity = "1";
                                    statusEl.textContent = "Login failed (see log below)";
                                }}
                            }});
                        }},
                        "error-callback": function() {{
                            if (statusEl) {{
                                statusEl.textContent = "Verification failed. Please retry.";
                            }}
                        }}
                    }};
                    
                    if (window.CAPTCHA_RQDATA) {{
                        renderOptions.rqdata = window.CAPTCHA_RQDATA;
                    }}

                    hcaptcha.render("hcaptcha-box", renderOptions);
                }};

                const scriptEl = document.createElement("script");
                scriptEl.src = "https://js.hcaptcha.com/1/api.js?render=explicit&onload=onHCaptchaLoad";
                scriptEl.async = true;
                scriptEl.defer = true;
                body.appendChild(scriptEl);
            }}

            if (document.body) {{
                init();
            }} else {{
                const observer = new MutationObserver(function() {{
                    if (document.body) {{
                        observer.disconnect();
                        init();
                    }}
                }});
                observer.observe(document.documentElement, {{ childList: true, subtree: true }});
            }}
        }})();
        "##,
        sitekey.replace('"', "\\\""),
        rqdata_js,
        rqtoken_js,
        session_id_js,
        ticket.replace('"', "\\\""),
        app_origin.replace('"', "\\\""),
        DISCORD_SPOOF_SUPER_PROPERTIES
    );

    let handle = app.clone();
    let window_builder =
        tauri::WebviewWindowBuilder::new(&app, "captcha-window", tauri::WebviewUrl::External(url))
            .title("Verification Required")
            .user_agent("")
            .inner_size(400.0, 550.0)
            .resizable(false)
            .always_on_top(true)
            .devtools(true)
            .initialization_script(&script)
            .on_navigation(move |u| {
                let query_pairs = u.query_pairs();
                let mut encrypted_token = None;
                for (key, val) in query_pairs {
                    if key == "encrypted_token" {
                        encrypted_token = Some(val.into_owned());
                        break;
                    }
                }

                if let Some(t) = encrypted_token {
                    use tauri::Emitter;
                    #[derive(serde::Serialize, Clone)]
                    struct SuccessPayload {
                        token: String,
                    }
                    let _ = handle.emit("hcaptcha-success", SuccessPayload { token: t });
                    false
                } else {
                    true
                }
            });

    let _window = window_builder.build().map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_websocket::init())
        .invoke_handler(tauri::generate_handler![open_captcha_window])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
