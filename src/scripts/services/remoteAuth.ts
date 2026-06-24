import WebSocket, { Message as WebSocketMessage } from "@tauri-apps/plugin-websocket";

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

	constructor(client: DiscordClient) {
		super();
		this.client = client;
	}

	async init() {
		try {
			this.keyPair = await window.crypto.subtle.generateKey(
				{
					name: "RSA-OAEP",
					modulusLength: 2048,
					publicExponent: new Uint8Array([1, 0, 1]),
					hash: "SHA-256"
				},
				true,
				["decrypt"]
			);

			const spki = await window.crypto.subtle.exportKey("spki", this.keyPair.publicKey);
			const encodedPublicKey = arrayBufferToBase64(spki);

			this.ws = await WebSocket.connect("wss://remote-auth-gateway.discord.gg/?v=2", {
				headers: {
					"Origin": "https://discord.com"
				}
			});
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
					const decryptedBytes = await window.crypto.subtle.decrypt(
						{ name: "RSA-OAEP" },
						this.keyPair!.privateKey,
						encryptedBytes
					);

					const hashBuffer = await window.crypto.subtle.digest("SHA-256", decryptedBytes);
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
				const qrURL = `https://discord.com/ra/${message.fingerprint}`;
				this.dispatchEvent(new CustomEvent("qr", { detail: qrURL }));
				break;

			case "pending_ticket":
				try {
					const encryptedBytes = base64URLDecode(message.encrypted_user_payload);
					const decryptedBytes = await window.crypto.subtle.decrypt(
						{ name: "RSA-OAEP" },
						this.keyPair!.privateKey,
						encryptedBytes
					);

					const decryptedString = new TextDecoder().decode(decryptedBytes);
					const [id, discriminator, avatar, username] = decryptedString.split(":");

					this.dispatchEvent(new CustomEvent("user_detected", {
						detail: {
							id,
							discriminator,
							avatar,
							username
						}
					}));
				} catch (error) {
					console.error("Failed to decrypt user payload:", error);
					this.dispatchEvent(new CustomEvent("error", { detail: error }));
				}
				break;

			case "pending_login":
				try {
					const ticketResponse = await this.client.rest.request("/users/@me/remote-auth/login", {
						method: "POST",
						body: JSON.stringify({
							ticket: message.ticket
						})
					});

					const ticketData = await ticketResponse.json();
					const encryptedBytes = base64URLDecode(ticketData.encrypted_token);
					const decryptedBytes = await window.crypto.subtle.decrypt(
						{ name: "RSA-OAEP" },
						this.keyPair!.privateKey,
						encryptedBytes
					);

					const token = new TextDecoder().decode(decryptedBytes);
					this.dispatchEvent(new CustomEvent("token", { detail: token }));
				} catch (error) {
					console.error("Failed to complete login:", error);
					this.dispatchEvent(new CustomEvent("error", { detail: error }));
				}
				this.cleanup();
				break;

			case "cancel":
				this.dispatchEvent(new Event("cancel"));
				this.cleanup();
				break;
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
		}
	}
};