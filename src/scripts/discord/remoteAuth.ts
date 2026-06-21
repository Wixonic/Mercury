import WebSocket, { Message as WebSocketMessage } from "@tauri-apps/plugin-websocket";

import type { DiscordClient } from "/scripts/discord.ts";
import {
	arrayBufferToBase64,
	base64ToArrayBuffer,
	base64URLEncode,
	base64URLDecode
} from "/scripts/lib/utils.ts";

export class RemoteAuthClient {
	client: DiscordClient;
	ws: WebSocket | undefined;
	keyPair: CryptoKeyPair | undefined;
	heartbeatTimer: any;

	onQRReceived: ((URL: string) => void) | undefined;
	onUserDetected: ((user: { id: string; discriminator: string; avatar: string; username: string }) => void) | undefined;
	onTokenReceived: ((token: string) => void) | undefined;
	onCancel: (() => void) | undefined;
	onError: ((error: any) => void) | undefined;

	constructor(client: DiscordClient) {
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
					return;
				}

				if (rawMessage.type !== "Text") return;

				try {
					const message = JSON.parse(rawMessage.data);
					console.log("Remote Auth WebSocket message:", message);
					await this.handleMessage(message, encodedPublicKey);
				} catch (error) {
					console.error("Failed to parse remote auth message:", error);
					if (this.onError) this.onError(error);
				}
			});
		} catch (error) {
			console.error("Failed to initialize remote auth:", error);
			if (this.onError) this.onError(error);
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
					if (this.onError) this.onError(error);
				}
				break;

			case "pending_remote_init":
				const qrURL = `https://discord.com/ra/${message.fingerprint}`;
				if (this.onQRReceived) this.onQRReceived(qrURL);
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

					if (this.onUserDetected) {
						this.onUserDetected({
							id,
							discriminator,
							avatar,
							username
						});
					}
				} catch (error) {
					console.error("Failed to decrypt user payload:", error);
					if (this.onError) this.onError(error);
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
					if (this.onTokenReceived) this.onTokenReceived(token);
				} catch (error) {
					console.error("Failed to complete login:", error);
					if (this.onError) this.onError(error);
				}
				this.cleanup();
				break;

			case "cancel":
				if (this.onCancel) this.onCancel();
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
			this.ws.disconnect();
			this.ws = undefined;
		}
	}
};