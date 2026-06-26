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
    let url = tauri::Url::parse("https://discord.com/robots.txt").map_err(|e| e.to_string())?;

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
        r#"
        (function() {{
            window.CAPTCHA_SITEKEY = "{}";
            window.CAPTCHA_RQDATA = {};
            window.CAPTCHA_RQTOKEN = {};
            window.CAPTCHA_SESSION_ID = {};
            window.CAPTCHA_TICKET = "{}";
            window.APP_ORIGIN = "{}";

            document.addEventListener("DOMContentLoaded", function() {{
                document.open();
                document.write(`
                    <!DOCTYPE html>
                    <html lang="en-US">
                    <head>
                        <title>Mercury Verification</title>
                        <meta charset="utf-8" />
                        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                        <style>
                            * {{
                                margin: 0;
                                padding: 0;
                                box-sizing: border-box;
                            }}
                            body {{
                                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                                background: #1e1f22;
                                color: #f2f3f5;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                flex-direction: column;
                                min-height: 100vh;
                                width: 100%;
                                overflow: hidden;
                                gap: 1rem;
                                padding: 1.5rem;
                            }}
                            .container {{
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                gap: 1rem;
                                text-align: center;
                            }}
                            h1 {{
                                font-size: 1.25rem;
                                font-weight: 600;
                                color: #ffffff;
                            }}
                            p {{
                                font-size: 0.875rem;
                                color: #b5bac1;
                                max-width: 280px;
                                line-height: 1.4;
                            }}
                            #hcaptcha-box {{
                                display: flex;
                                justify-content: center;
                                align-items: center;
                                min-height: 78px;
                                margin-top: 0.5rem;
                            }}
                            #status {{
                                font-size: 0.8rem;
                                font-weight: 500;
                                opacity: 0.6;
                                transition: all 0.2s ease;
                            }}
                            .success {{
                                color: #23a55a;
                                opacity: 1 !important;
                            }}
                            .error {{
                                color: #f23f43;
                                opacity: 1 !important;
                            }}
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h1>Security Verification</h1>
                            <p>Please complete the captcha to finish logging in to Mercury.</p>
                            <div id="hcaptcha-box"></div>
                            <p id="status">Loading verification...</p>
                        </div>
                        <script>
                            function onHCaptchaLoad() {{
                                const statusEl = document.getElementById("status");
                                statusEl.textContent = "Waiting for verification...";
                                
                                const renderOptions = {{
                                    sitekey: window.CAPTCHA_SITEKEY,
                                    theme: "dark",
                                    callback: function(token) {{
                                        statusEl.className = "success";
                                        statusEl.textContent = "Verifying with Discord...";
                                        
                                        const headers = {{
                                            "Content-Type": "application/json",
                                            "X-Captcha-Key": token
                                        }};
                                        if (window.CAPTCHA_RQTOKEN) {{
                                            headers["X-Captcha-Rqtoken"] = window.CAPTCHA_RQTOKEN;
                                        }}
                                        if (window.CAPTCHA_SESSION_ID) {{
                                            headers["X-Captcha-Session-Id"] = window.CAPTCHA_SESSION_ID;
                                        }}

                                        fetch("/api/v9/users/@me/remote-auth/login", {{
                                            method: "POST",
                                            headers: headers,
                                            body: JSON.stringify({{ ticket: window.CAPTCHA_TICKET }})
                                        }})
                                        .then(async function(res) {{
                                            const data = await res.json();
                                            if (res.ok && data.encrypted_token) {{
                                                statusEl.textContent = "✓ Verified successfully";
                                                const callbackUrl = window.APP_ORIGIN + "/?encrypted_token=" + encodeURIComponent(data.encrypted_token);
                                                window.location.href = callbackUrl;
                                            }} else {{
                                                statusEl.className = "error";
                                                statusEl.textContent = "Login failed: " + (data.message || JSON.stringify(data));
                                            }}
                                        }})
                                        .catch(function(err) {{
                                            statusEl.className = "error";
                                            statusEl.textContent = "Network error: " + err.message;
                                        }});
                                    }},
                                    "error-callback": function() {{
                                        statusEl.textContent = "Verification failed. Please retry.";
                                    }}
                                }};
                                
                                if (window.CAPTCHA_RQDATA) {{
                                    renderOptions.rqdata = window.CAPTCHA_RQDATA;
                                }}

                                hcaptcha.render("hcaptcha-box", renderOptions);
                            }}
                        </script>
                        <script src="https://js.hcaptcha.com/1/api.js?render=explicit&onload=onHCaptchaLoad&host=discord.com" async defer></script>
                    </body>
                    </html>
                `);
                document.close();
            }});
        }})();
        "#,
        sitekey.replace('"', "\\\""),
        rqdata_js,
        rqtoken_js,
        session_id_js,
        ticket.replace('"', "\\\""),
        app_origin.replace('"', "\\\"")
    );

    let handle = app.clone();
    let window_builder = tauri::WebviewWindowBuilder::new(
        &app,
        "captcha-window",
        tauri::WebviewUrl::External(url)
    )
    .title("Verification Required")
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

