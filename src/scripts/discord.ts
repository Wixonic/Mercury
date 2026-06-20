import WebSocket, { Message as WebSocketMessage } from "@tauri-apps/plugin-websocket";

import { Client, RestClient } from "/scripts/lib/client.ts";
import { join } from "/scripts/lib/utils.ts";

type GatewayMessage = {
	code: number;
	data: any;
	sequence: number | null;
	event: string | null;
}

export class DiscordClient extends Client {
	rest: RestClient;
	ws: WebSocket | undefined;

	heatbeat: number | undefined;
	heartbeatTimestamp: number | undefined;
	ping: number | undefined;

	token: string | undefined;
	sessionId: string | undefined;
	resumeGatewayURL: string | undefined;
	sequence: number | null = null;

	constructor(restBaseURL: URL) {
		super();
		this.rest = new RestClient(restBaseURL);
	}

	async init() {
		try {
			const gatewayResponse = await this.rest.request("/gateway");
			const gatewayData = await gatewayResponse.json();
			console.log("Gateway response data:", gatewayData);

			try {
				this.ws = await WebSocket.connect(join(gatewayData.url, "?v=10&encoding=json"));
				this.ws.addListener(this.gateway.bind(this));
			} catch (error) {
				console.error("Failed to initialize Discord client:", error);
			}
		} catch (error) {
			console.error("Failed to get Discord Gateway URL:", error);
		}
	}

	async reconnect() {
		try {
			const url = this.resumeGatewayURL ?? (await (await this.rest.request("/gateway")).json()).url;

			this.ws = await WebSocket.connect(join(url, "?v=10&encoding=json"));
			this.ws.addListener(this.gateway.bind(this));
		} catch (error) {
			console.error("Failed to reconnect:", error);
			setTimeout(() => this.reconnect(), 5000);
		}
	}

	async disconnect() {
		if (this.heatbeat) clearInterval(this.heatbeat);
		this.heatbeat = undefined;

		if (this.ws) {
			try {
				await this.ws.disconnect();
			} catch (error) {
				console.error("Failed to disconnect WebSocket:", error);
			}

			this.ws = undefined;
		}

		this.reconnect();
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
			this.disconnect();
			return;
		}

		const message = this.parseGatewayMessage(rawMessage);
		if (!message) return;

		switch (message.code) {
			case 0: // Dispatch
				this.sequence = message.sequence;
				console.log("Dispatch Event:", message.event);

				if (message.event === "READY") {
					this.sessionId = message.data.session_id;
					this.resumeGatewayURL = message.data.resume_gateway_url;
					console.log("Ready - Session ID:", this.sessionId);
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
					if (this.token) this.sendIdentify();
				}
				break;

			case 10: // Hello
				this.sendHeartbeat();
				this.heatbeat = setInterval(() => this.sendHeartbeat(), message.data.heartbeat_interval);

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
		console.log("Sending Identify...");
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
		console.log("Sending Resume...");
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