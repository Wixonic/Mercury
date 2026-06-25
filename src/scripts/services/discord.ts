import WebSocket, { Message as WebSocketMessage } from "@tauri-apps/plugin-websocket";

import { RemoteAuthClient } from "/scripts/services/remoteAuth.ts";
import { Client, RestClient } from "/scripts/lib/client.ts";
import { join } from "/scripts/lib/utils.ts";
import { store } from "/scripts/store/store.ts";
import type { Session } from "/scripts/store/store.ts";

type GatewayMessage = {
	code: number;
	data: any;
	sequence: number | null;
	event: string | null;
}

export class DiscordClient extends Client {
	rest: RestClient;
	ws: WebSocket | undefined;
	remoteAuth: RemoteAuthClient;

	heartbeat: ReturnType<typeof setInterval> | undefined;
	heartbeatTimestamp: number | undefined;
	ping: number | undefined;

	token: string | undefined;
	sessionId: string | undefined;
	resumeGatewayURL: string | undefined;
	sequence: number | null = null;
	isUnloading = false;

	constructor(restBaseURL: URL) {
		super();
		this.rest = new RestClient(restBaseURL);
		this.remoteAuth = new RemoteAuthClient(this);

		this.sessionId = sessionStorage.getItem("discord_session_id") || undefined;
		this.resumeGatewayURL = sessionStorage.getItem("discord_resume_gateway_url") || undefined;
		const seq = sessionStorage.getItem("discord_sequence");
		this.sequence = seq ? parseInt(seq, 10) : null;
	}

	async init(token?: string) {
		if (token) {
			this.token = token;
			this.rest.init(token);
		}

		try {
			let gatewayURL = this.resumeGatewayURL;
			if (!gatewayURL) {
				const gatewayResponse = await this.rest.request("/gateway");
				const gatewayData = await gatewayResponse.json();
				console.log("Gateway response data:", gatewayData);
				gatewayURL = gatewayData.url;
			} else console.log("Using cached resume gateway URL:", gatewayURL);

			try {
				this.ws = await WebSocket.connect(join(gatewayURL!, "?v=9&encoding=json"));
				sessionStorage.setItem("discord_ws_id", String(this.ws.id));
				this.ws.addListener(this.gateway.bind(this));
			} catch (error) {
				console.error("Failed to initialize Discord client:", error);
			}
		} catch (error) {
			console.error("Failed to get Discord Gateway URL:", error);
		}
	}

	async reconnect() {
		if (this.isUnloading) return;
		try {
			const gatewayURL = this.resumeGatewayURL ?? (await (await this.rest.request("/gateway")).json()).url;

			this.ws = await WebSocket.connect(join(gatewayURL, "?v=10&encoding=json"));
			this.ws.addListener(this.gateway.bind(this));
		} catch (error) {
			console.error("Failed to reconnect:", error);
			if (!this.isUnloading) setTimeout(() => this.reconnect(), 5000);
		}
	}

	async disconnect(reconnect = true) {
		if (this.heartbeat) clearInterval(this.heartbeat);
		this.heartbeat = undefined;

		if (this.ws) {
			const wsToDisconnect = this.ws;
			this.ws = undefined;
			try {
				await wsToDisconnect.disconnect();
			} catch (error) {
				console.error("Failed to disconnect WebSocket:", error);
			}
		}

		if (reconnect) this.reconnect();
	}

	parseGatewayMessage(rawMessage: WebSocketMessage): GatewayMessage | null {
		try {
			if (rawMessage.type !== "Text") return null;

			const message = JSON.parse(rawMessage.data as string);

			return {
				code: message.op,
				data: message.d,
				sequence: message.s ?? null,
				event: message.t ?? null
			};
		} catch (error) {
			console.error("Failed to parse gateway message:", error);
			return null;
		}
	}

	async gateway(rawMessage: WebSocketMessage) {
		if (rawMessage.type === "Close") {
			console.log("WebSocket connection closed:", rawMessage.data);
			if (this.heartbeat) clearInterval(this.heartbeat);
			this.heartbeat = undefined;
			this.ws = undefined;
			if (!this.isUnloading) this.reconnect();
			return;
		}

		const message = this.parseGatewayMessage(rawMessage);
		if (!message) return;

		switch (message.code) {
			case 0: // Dispatch
				this.sequence = message.sequence;
				if (this.sequence !== null) sessionStorage.setItem("discord_sequence", this.sequence.toString());
				console.log("Dispatch Event:", message.event);

				switch (message.event) {
					case "READY":
						this.sessionId = message.data.session_id;
						this.resumeGatewayURL = message.data.resume_gateway_url;
						console.log("Ready - Session ID:", this.sessionId);

						sessionStorage.setItem("discord_session_id", this.sessionId!);
						sessionStorage.setItem("discord_resume_gateway_url", this.resumeGatewayURL!);

						store.setState({
							currentUser: message.data.user,
							route: "app"
						});
						break;

					case "SESSIONS_REPLACE":
						const sessions: Session[] = message.data;
						const currentSession = sessions.find((session) => session.session_id === this.sessionId) ?? sessions.find((session) => session.active);

						store.setState({
							sessions,
							currentPresence: currentSession?.status ?? null
						});

						this.dispatchEvent(new CustomEvent("presenceUpdate", {
							detail: currentSession?.status ?? null
						}));
						break;

					default:
						console.log("Unhandled dispatch event:", message.event, "with data:", message.data);
						break;
				}
				break;

			case 7: // Reconnect
				this.disconnect();
				break;

			case 9: // Invalid Session
				console.log("Invalid Session:", message.data);
				if (message.data === true) this.sendResume();
				else {
					this.sessionId = undefined;
					this.sequence = null;
					sessionStorage.removeItem("discord_session_id");
					sessionStorage.removeItem("discord_sequence");
					sessionStorage.removeItem("discord_resume_gateway_url");
					if (this.token) this.sendIdentify();
				}
				break;

			case 10: // Hello
				this.sendHeartbeat();
				this.heartbeat = setInterval(() => this.sendHeartbeat(), message.data.heartbeat_interval);

				if (this.sessionId && this.sequence !== null && this.resumeGatewayURL && this.token) this.sendResume();
				else if (this.token) this.sendIdentify();
				break;

			case 11: // Heartbeat ACK
				if (this.heartbeatTimestamp) this.ping = performance.now() - this.heartbeatTimestamp;
				this.heartbeatTimestamp = undefined;
				console.log("Ping:", this.ping);
				break;

			default:
				console.warn("Unhandled gateway message code:", message.code, "with data:", message.data);
				break;
		}
	}

	async send(data: any) {
		if (!this.ws) {
			console.error("WebSocket is not initialized.");
			return;
		}

		try {
			return await this.ws.send(JSON.stringify(data));
		} catch (error) {
			console.error("Failed to send data over WebSocket:", error);
			return null;
		}
	}

	async sendHeartbeat() {
		if (this.heartbeatTimestamp) {
			console.warn("Heartbeat timeout. Reconnecting...");
			this.disconnect();
			return;
		}

		this.heartbeatTimestamp = performance.now();
		this.send({
			op: 1, // Heartbeat
			d: this.sequence
		});
	}

	async sendIdentify() {
		this.send({
			op: 2,
			d: {
				token: this.token,
				properties: {
					os: "unknown",
					browser: "mercury",
					device: "mercury"
				},
				compress: false,
				intents: 513
			}
		});
	}

	async sendResume() {
		this.send({
			op: 6,
			d: {
				token: this.token,
				session_id: this.sessionId,
				seq: this.sequence
			}
		});
	}
};