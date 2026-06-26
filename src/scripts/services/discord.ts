import WebSocket, { Message as WebSocketMessage } from "@tauri-apps/plugin-websocket";

import { RemoteAuthClient } from "/scripts/services/remoteAuth.ts";

import { Client, RestClient } from "/scripts/lib/client.ts";
import { join, fake, wait } from "/scripts/lib/utils.ts";


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
	helloWatchdog: ReturnType<typeof setTimeout> | undefined;
	unlistenGateway: (() => void) | undefined;

	private helloTimeout = 2000;

	constructor(restBaseURL: URL) {
		super();
		this.rest = new RestClient(restBaseURL);
		this.remoteAuth = new RemoteAuthClient(this);

		this.sessionId = sessionStorage.getItem("discord_session_id") || undefined;
		this.resumeGatewayURL = sessionStorage.getItem("discord_resume_gateway_url") || undefined;
		const sequence = sessionStorage.getItem("discord_sequence");
		this.sequence = sequence ? parseInt(sequence, 10) : null;
	}

	startHelloWatchdog() {
		if (this.helloWatchdog) clearTimeout(this.helloWatchdog);
		this.helloWatchdog = setTimeout(() => {
			console.warn("Did not receive Hello in time. Retrying...");

			this.resumeGatewayURL = undefined;
			sessionStorage.removeItem("discord_resume_gateway_url");
			this.disconnect(true);
		}, this.helloTimeout);
	}

	resetAndRedirectToLogin() {
		this.token = undefined;
		this.sessionId = undefined;
		this.sequence = null;
		this.resumeGatewayURL = undefined;
		sessionStorage.removeItem("discord_session_id");
		sessionStorage.removeItem("discord_sequence");
		sessionStorage.removeItem("discord_resume_gateway_url");

		store.setState({
			token: null,
			currentUser: null,
			route: "login"
		});

		this.disconnect(false);
	}

	async init(token?: string) {
		this.dispatchEvent(new CustomEvent("connecting"));

		if (token) {
			this.token = token;
			this.rest.init(token);
		}

		try {
			// Validate token using REST request to /users/@me
			try {
				const userResponse = await this.rest.request("/users/@me");
				const userData = await userResponse.json();
				store.setState({ currentUser: userData });
			} catch (error: any) {
				console.error("Token verification failed:", error);
				if (error.message && (error.message.includes("401") || error.message.includes("403"))) {
					this.resetAndRedirectToLogin();
					return;
				}
			}

			let gatewayURL = this.resumeGatewayURL;
			if (!gatewayURL) {
				const gatewayResponse = await this.rest.request("/gateway");
				const gatewayData = await gatewayResponse.json();
				console.log("Gateway response data:", gatewayData);
				gatewayURL = gatewayData.url;
			} else console.log("Using cached resume gateway URL:", gatewayURL);

			try {
				this.ws = await WebSocket.connect(join(gatewayURL!, "?v=9&encoding=json"), {
					headers: {
						"Origin": "https://discord.com",
						"User-Agent": navigator.userAgent
					}
				});
				this.unlistenGateway = this.ws.addListener(this.gateway.bind(this));
				this.startHelloWatchdog();
			} catch (error) {
				console.error("Failed to initialize Discord client:", error);
			}
		} catch (error: any) {
			console.error("Failed to get Discord Gateway URL:", error);
			if (error.message && (error.message.includes("401") || error.message.includes("403"))) {
				this.resetAndRedirectToLogin();
			}
		}
	}

	async reconnect() {
		this.dispatchEvent(new CustomEvent("connecting"));
		if (this.isUnloading) return;
		try {
			const gatewayURL = this.resumeGatewayURL ?? (await (await this.rest.request("/gateway")).json()).url;

			this.ws = await WebSocket.connect(join(gatewayURL, "?v=9&encoding=json"), {
				headers: {
					"Origin": "https://discord.com",
					"User-Agent": navigator.userAgent
				}
			});
			this.unlistenGateway = this.ws.addListener(this.gateway.bind(this));
			this.startHelloWatchdog();
		} catch (error: any) {
			console.error("Failed to reconnect:", error);
			if (error.message && (error.message.includes("401") || error.message.includes("403"))) {
				this.resetAndRedirectToLogin();
				return;
			}
			this.dispatchEvent(new CustomEvent("disconnected", { detail: error }));
			if (!this.isUnloading) this.reconnect();
		}
	}

	async disconnect(reconnect = true) {
		this.dispatchEvent(new CustomEvent("disconnected"));

		if (this.heartbeat) clearInterval(this.heartbeat);
		this.heartbeat = undefined;
		if (this.helloWatchdog) clearTimeout(this.helloWatchdog);
		this.helloWatchdog = undefined;

		if (this.unlistenGateway) {
			this.unlistenGateway();
			this.unlistenGateway = undefined;
		}

		if (this.ws) {
			const wsToDisconnect = this.ws;
			this.ws = undefined;
			try {
				await Promise.race([
					wsToDisconnect.disconnect(),
					wait(500)
				]);
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
			console.error("WebSocket connection closed:", rawMessage.data);
			const closeFrame = rawMessage.data;
			if (closeFrame && (closeFrame.code === 4004 || closeFrame.code === 4014)) {
				console.error(`Authentication failed (Close code: ${closeFrame.code}). Redirecting to login.`);
				this.resetAndRedirectToLogin();
				return;
			}
			this.reconnect();
			return;
		}

		const message = this.parseGatewayMessage(rawMessage);
		if (!message) return;

		switch (message.code) {
			case 0: // Dispatch
				this.sequence = message.sequence;
				if (this.sequence !== null) sessionStorage.setItem("discord_sequence", this.sequence.toString());

				switch (message.event) {
					case "READY":
						this.sessionId = message.data.session_id;
						this.resumeGatewayURL = message.data.resume_gateway_url;

						sessionStorage.setItem("discord_session_id", this.sessionId!);
						sessionStorage.setItem("discord_resume_gateway_url", this.resumeGatewayURL!);

						console.info("Ready - Session ID:", this.sessionId);

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

						console.log("Sessions Replaced");

						this.dispatchEvent(new CustomEvent("presenceUpdate", {
							detail: currentSession?.status ?? null
						}));
						break;

					default:
						console.warn("Unhandled dispatch event:", message.event, "with data:", message.data);
						break;
				}
				break;

			case 7: // Reconnect
				console.warn("Reconnect requested by server");
				this.disconnect();
				break;

			case 9: // Invalid Session
				console.warn("Invalid Session");
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
				if (this.helloWatchdog) {
					clearTimeout(this.helloWatchdog);
					this.helloWatchdog = undefined;
				}
				this.sendHeartbeat();
				this.heartbeat = setInterval(() => this.sendHeartbeat(), message.data.heartbeat_interval);

				if (this.sessionId && this.sequence !== null && this.resumeGatewayURL && this.token) this.sendResume();
				else if (this.token) this.sendIdentify();
				break;

			case 11: // Heartbeat ACK
				if (this.heartbeatTimestamp) this.ping = performance.now() - this.heartbeatTimestamp;
				this.heartbeatTimestamp = undefined;
				this.dispatchEvent(new CustomEvent("heartbeat", { detail: this.ping }));
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
		const lastIdentify = sessionStorage.getItem("discord_last_identify");
		if (lastIdentify && (Date.now() - parseInt(lastIdentify, 10)) < 5000) await wait(5000 - (Date.now() - parseInt(lastIdentify, 10)));

		sessionStorage.setItem("discord_last_identify", Date.now().toString());
		this.send({
			op: 2,
			d: {
				token: this.token,
				properties: {
					os: fake.os,
					browser: fake.browser,
					device: fake.device,
					browser_user_agent: navigator.userAgent,
					browser_version: fake.browser_version,
					os_version: fake.os_version,
					referrer: "",
					referring_domain: "",
					referrer_current: "",
					referring_domain_current: "",
					release_channel: "stable"
				},
				compress: false,
				intents: 513
			}
		});
	}

	async sendResume() {
		this.dispatchEvent(new CustomEvent("disconnected"));
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