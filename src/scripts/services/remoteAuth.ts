import WebSocket, { Message as WebSocketMessage } from "@tauri-apps/plugin-websocket";
import { fetch } from "@tauri-apps/plugin-http";

import type { DiscordClient } from "/scripts/services/discord.ts";
import {
	arrayBufferToBase64,
	base64ToArrayBuffer,
	base64URLEncode,
	base64URLDecode
} from "/scripts/lib/utils.ts";

export class RemoteAuthClient extends EventTarget {
	client: DiscordClient;
	ws: WebSocket | undefined;
	keyPair: CryptoKeyPair | undefined;
	heartbeatTimer: any;
	pendingLoginTicket: string | undefined;

	constructor(client: DiscordClient) {
		super();
		this.client = client;
	}

	async init() {
		try {
			const oldRemoteWebSocketID = sessionStorage.getItem("discord_remote_ws_id");
			if (oldRemoteWebSocketID) {
				try {
					const oldWebSocket = new WebSocket(Number(oldRemoteWebSocketID), new Set());
					oldWebSocket.disconnect().catch(() => { });
				} catch (_error) { }
				sessionStorage.removeItem("discord_remote_ws_id");
			}

			this.keyPair = await crypto.subtle.generateKey(
				{
					name: "RSA-OAEP",
					modulusLength: 2048,
					publicExponent: new Uint8Array([1, 0, 1]),
					hash: "SHA-256"
				},
				true,
				["decrypt"]
			);

			const spki = await crypto.subtle.exportKey("spki", this.keyPair.publicKey);
			const encodedPublicKey = arrayBufferToBase64(spki);

			this.ws = await WebSocket.connect("wss://remote-auth-gateway.discord.gg/?v=2", {
				headers: {
					"Origin": "https://discord.com",
					"User-Agent": navigator.userAgent
				}
			});
			sessionStorage.setItem("discord_remote_ws_id", this.ws.id.toString());

			this.ws.addListener(async (rawMessage: WebSocketMessage) => {
				if (rawMessage.type === "Close") {
					console.log("Remote Auth WebSocket connection closed:", rawMessage.data);
					this.cleanup();
					this.dispatchEvent(new Event("close"));
					return;
				}

				if (rawMessage.type !== "Text") return;

				try {
					const message = JSON.parse(rawMessage.data);
					console.log("Remote Auth WebSocket message:", message);
					await this.handleMessage(message, encodedPublicKey);
				} catch (error) {
					console.error("Failed to parse remote auth message:", error);
					this.dispatchEvent(new CustomEvent("error", { detail: error }));
				}
			});
		} catch (error) {
			console.error("Failed to initialize remote auth:", error);
			this.dispatchEvent(new CustomEvent("error", { detail: error }));
		}
	}

	async handleMessage(message: any, encodedPublicKey: string) {
		switch (message.op) {
			case "hello":
				this.heartbeatTimer = setInterval(() => {
					this.send({
						op: "heartbeat"
					});
				}, message.heartbeat_interval);

				this.send({
					op: "init",
					encoded_public_key: encodedPublicKey
				});
				break;

			case "nonce_proof":
				try {
					const encryptedBytes = base64ToArrayBuffer(message.encrypted_nonce);
					const decryptedBytes = await crypto.subtle.decrypt(
						{ name: "RSA-OAEP" },
						this.keyPair!.privateKey,
						encryptedBytes
					);

					const hashBuffer = await crypto.subtle.digest("SHA-256", decryptedBytes);
					const proof = base64URLEncode(hashBuffer);

					this.send({
						op: "nonce_proof",
						proof: proof
					});
				} catch (error) {
					console.error("Failed to solve nonce proof:", error);
					this.dispatchEvent(new CustomEvent("error", { detail: error }));
				}
				break;

			case "pending_remote_init":
				const qrURL = `https://discordapp.com/ra/${message.fingerprint}`;
				this.dispatchEvent(new CustomEvent("qr", { detail: qrURL }));
				break;

			case "pending_ticket":
				try {
					const encryptedBytes = base64URLDecode(message.encrypted_user_payload);
					const decryptedBytes = await crypto.subtle.decrypt(
						{ name: "RSA-OAEP" },
						this.keyPair!.privateKey,
						encryptedBytes
					);

					const decryptedString = new TextDecoder().decode(decryptedBytes);
					const [id, discriminator, avatar, username] = decryptedString.split(":");

					this.dispatchEvent(new CustomEvent("user_detected", {
						detail: { id, discriminator, avatar, username }
					}));
				} catch (error) {
					console.error("Failed to decrypt user payload:", error);
					this.dispatchEvent(new CustomEvent("error", { detail: error }));
				}
				break;

			case "pending_login":
				await this.performLogin(message.ticket);
				break;

			case "cancel":
				this.dispatchEvent(new Event("cancel"));
				this.cleanup();
				break;
		}
	}

	async performLogin(
		ticket: string,
		captchaKey?: string,
		captchaRqtoken?: string,
		captchaSessionId?: string,
		userAgent?: string
	) {
		const extraHeaders: Record<string, string> = {};
		if (captchaKey) extraHeaders["X-Captcha-Key"] = captchaKey;
		if (captchaRqtoken) extraHeaders["X-Captcha-Rqtoken"] = captchaRqtoken;
		if (captchaSessionId) extraHeaders["X-Captcha-Session-Id"] = captchaSessionId;

		try {
			const response = await fetch(`${this.client.rest.baseURL}/users/@me/remote-auth/login`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Origin": "https://discord.com",
					"User-Agent": userAgent || navigator.userAgent,
					...extraHeaders
				},
				body: JSON.stringify({ ticket })
			});

			const data = await response.json();

			if (!response.ok) {
				if (Array.isArray(data.captcha_key) && data.captcha_key.includes("captcha-required")) {
					console.log("Captcha required, waiting for user to solve...");
					this.pendingLoginTicket = ticket;
					this.dispatchEvent(new CustomEvent("captcha_required", {
						detail: {
							sitekey: data.captcha_sitekey,
							rqdata: data.captcha_rqdata,
							rqtoken: data.captcha_rqtoken,
							sessionId: data.captcha_session_id,
							ticket: ticket
						}
					}));
					return;
				}
				throw new Error(`HTTP error: ${response.status} ${response.statusText} — ${JSON.stringify(data)}`);
			}

			const encryptedBytes = base64URLDecode(data.encrypted_token);
			const decryptedBytes = await crypto.subtle.decrypt(
				{ name: "RSA-OAEP" },
				this.keyPair!.privateKey,
				encryptedBytes
			);

			const token = new TextDecoder().decode(decryptedBytes);
			this.dispatchEvent(new CustomEvent("token", { detail: token }));
			this.cleanup();
		} catch (error) {
			console.error("Failed to complete login:", error);
			this.dispatchEvent(new CustomEvent("error", { detail: error }));
			this.cleanup();
		}
	}

	async completeCaptchaLogin(
		captchaKey: string,
		captchaRqtoken: string,
		captchaSessionId?: string,
		userAgent?: string
	) {
		if (!this.pendingLoginTicket) {
			console.error("No pending login ticket for captcha completion");
			return;
		}
		const ticket = this.pendingLoginTicket;
		this.pendingLoginTicket = undefined;
		await this.performLogin(ticket, captchaKey, captchaRqtoken, captchaSessionId, userAgent);
	}

	async completeManualTokenDecrypt(encryptedToken: string) {
		try {
			const encryptedBytes = base64URLDecode(encryptedToken);
			const decryptedBytes = await crypto.subtle.decrypt(
				{ name: "RSA-OAEP" },
				this.keyPair!.privateKey,
				encryptedBytes
			);

			const token = new TextDecoder().decode(decryptedBytes);
			this.dispatchEvent(new CustomEvent("token", { detail: token }));
			this.cleanup();
		} catch (error) {
			console.error("Failed to decrypt user token:", error);
			this.dispatchEvent(new CustomEvent("error", { detail: error }));
			this.cleanup();
		}
	}

	async send(data: any) {
		if (!this.ws) return;

		try {
			await this.ws.send(JSON.stringify(data));
		} catch (error) {
			console.error("Failed to send remote auth data:", error);
		}
	}

	cleanup() {
		if (this.heartbeatTimer) {
			clearInterval(this.heartbeatTimer);
			this.heartbeatTimer = null;
		}

		if (this.ws) {
			this.ws.disconnect().catch((error) => {
				console.error("Failed to disconnect Remote Auth WebSocket:", error);
			});
			this.ws = undefined;
			sessionStorage.removeItem("discord_remote_ws_id");
		}
	}
};