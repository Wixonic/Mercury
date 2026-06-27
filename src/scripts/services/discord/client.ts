import WebSocket, { Message as WebSocketMessage } from "@tauri-apps/plugin-websocket";

import { Client, RestClient } from "/scripts/lib/client.ts";
import { store, type Session } from "/scripts/lib/store.ts";
import { join, fake, wait } from "/scripts/lib/utils.ts";

import { GuildCollection } from "/scripts/services/discord/guild.ts";
import { Snowflake } from "/scripts/services/discord/snowflake.ts";
import { UserCollection, UserCustomStatus, UserStatusType } from "/scripts/services/discord/user.ts";

type GatewayMessage = {
	code: number;
	data: any;
	sequence: number | null;
	event: string | null;
};

type GuildFolder = {
	id: string;
	name: string;
	guild_ids: string[];
};

export enum ClientSettingsStickerAnimationOption {
	AlwaysAnimate = 0,
	AnimateOnInteraction = 1,
	NeverAnimate = 2
};

export enum ClientSettingsExplicitContentFilter {
	Disabled = 0,
	NonFriends = 1,
	AllMessages = 2
};

const ClientSettingsFriendDiscoveryFlags = {
	FindByPhone: 1n << 1n,
	FindByEmail: 1n << 2n,
} as const;
export type ClientSettingsFriendDiscoveryFlags = typeof ClientSettingsFriendDiscoveryFlags[keyof typeof ClientSettingsFriendDiscoveryFlags];

export interface ClientSettingsFriendSourceFlags {
	all?: boolean;
	mutual_friends?: boolean;
	mutual_guilds?: boolean;
};

export enum ClientSettingsSlayerSdkReceiveInGameDms {
	Unset = 0,
	All = 1,
	UsersWithGame = 2,
	None = 3
};

export interface ClientSettings {
	activity_restricted_guild_ids: Snowflake[];
	activity_joining_restricted_guild_ids: Snowflake[];
	afk_timeout: number;
	allow_accessibility_detection: boolean;
	allow_activity_party_privacy_friends: boolean;
	allow_activity_party_privacy_voice_channel: boolean;
	animate_emoji: boolean;
	animate_stickers: ClientSettingsStickerAnimationOption;
	contact_sync_enabled: boolean;
	convert_emoticons: boolean;
	custom_status: UserCustomStatus | null;
	default_guilds_restricted: boolean;
	detect_platform_accounts: boolean;
	developer_mode: boolean;
	disable_games_tab: boolean;
	enable_tts_command: boolean;
	explicit_content_filter: ClientSettingsExplicitContentFilter;
	friend_discovery_flags: ClientSettingsFriendDiscoveryFlags;
	friend_source_flags: ClientSettingsFriendSourceFlags | null;
	gif_auto_play: boolean;
	guild_folders: GuildFolder[];
	inline_attachment_media: boolean;
	inline_embed_media: boolean;
	locale: string;
	message_display_compact: boolean;
	native_phone_integration_enabled: boolean;
	render_embeds: boolean;
	render_reactions: boolean;
	restricted_guilds: Snowflake[];
	show_current_game: boolean;
	slayer_sdk_receive_dms_in_game: ClientSettingsSlayerSdkReceiveInGameDms;
	soundboard_volume: number;
	status: UserStatusType;
	stream_notifications_enabled: boolean;
	theme: "dark" | "light" | "darker" | "midnight";
	timezone_offset: number;
	view_nsfw_commands: boolean;
	view_nsfw_guilds: boolean;
};

export class DiscordClient extends Client {
	rest: RestClient;
	ws: WebSocket | undefined;

	guilds = new GuildCollection();
	users = new UserCollection();

	private heartbeat: ReturnType<typeof setInterval> | undefined;
	private heartbeatTimestamp: number | undefined;
	ping: number | undefined;

	token: string | undefined;
	sessionId: string | undefined;
	private resumeGatewayURL: string | undefined;
	private sequence: number | null = null;
	isUnloading = false;
	private helloWatchdog: ReturnType<typeof setTimeout> | undefined;
	private unlistenGateway: (() => void) | undefined;
	private connectionGeneration = 0;

	settings: ClientSettings | undefined;

	private helloTimeout = 3000;

	constructor(restBaseURL: URL) {
		super();
		this.rest = new RestClient(restBaseURL);

		this.sessionId = sessionStorage.getItem("discord_session_id") || undefined;
		this.resumeGatewayURL = sessionStorage.getItem("discord_resume_gateway_url") || undefined;
		const sequence = sessionStorage.getItem("discord_sequence");
		this.sequence = sequence ? parseInt(sequence, 10) : null;
	};

	async init(token?: string) {
		this.dispatchEvent(new CustomEvent("connecting"));

		if (token) {
			this.token = token;
			this.rest.init(token);
		}

		await this.disconnect(false);
		const generation = ++this.connectionGeneration;

		try {
			try {
				const userResponse = await this.rest.request("/users/@me");
				if (generation !== this.connectionGeneration) return;
				const userData = await userResponse.json();
				if (generation !== this.connectionGeneration) return;
				store.setState({ currentUser: userData });
			} catch (error: any) {
				console.error("Token verification failed:", error);
				if (generation !== this.connectionGeneration) return;
				if (error.message && (error.message.includes("401") || error.message.includes("403"))) {
					this.resetAndRedirectToLogin();
					return;
				}
			}

			let gatewayURL = this.resumeGatewayURL;
			if (!gatewayURL) {
				const gatewayResponse = await this.rest.request("/gateway");
				if (generation !== this.connectionGeneration) return;
				const gatewayData = await gatewayResponse.json();
				if (generation !== this.connectionGeneration) return;
				console.log("Gateway response data:", gatewayData);
				gatewayURL = gatewayData.url;
			} else console.log("Using cached resume gateway URL:", gatewayURL);

			try {
				const ws = await WebSocket.connect(join(gatewayURL!, "?v=9&encoding=json"), {
					headers: {
						"Origin": "https://discord.com",
						"User-Agent": fake.browser_user_agent
					}
				});
				if (generation !== this.connectionGeneration) {
					ws.disconnect().catch(console.error);
					return;
				}
				this.ws = ws;
				this.unlistenGateway = this.ws.addListener(this.gateway.bind(this));
				this.startHelloWatchdog();
			} catch (error) {
				console.error("Failed to initialize Discord client:", error);
			}
		} catch (error: any) {
			console.error("Failed to get Discord Gateway URL:", error);
			if (generation !== this.connectionGeneration) return;
			if (error.message && (error.message.includes("401") || error.message.includes("403"))) this.resetAndRedirectToLogin();
		}
	};

	private resetAndRedirectToLogin() {
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
	};

	private async reconnect() {
		this.dispatchEvent(new CustomEvent("connecting"));
		if (this.isUnloading) return;

		const generation = ++this.connectionGeneration;

		try {
			const gatewayURL = this.resumeGatewayURL ?? (await (await this.rest.request("/gateway")).json()).url;
			if (generation !== this.connectionGeneration) return;

			const ws = await WebSocket.connect(join(gatewayURL, "?v=9&encoding=json"), {
				headers: {
					"Origin": "https://discord.com",
					"User-Agent": fake.browser_user_agent
				}
			});
			if (generation !== this.connectionGeneration) {
				ws.disconnect().catch(console.error);
				return;
			}
			this.ws = ws;
			this.unlistenGateway = this.ws.addListener(this.gateway.bind(this));
			this.startHelloWatchdog();
		} catch (error: any) {
			console.error("Failed to reconnect:", error);
			if (generation !== this.connectionGeneration) return;
			if (error.message && (error.message.includes("401") || error.message.includes("403"))) {
				this.resetAndRedirectToLogin();
				return;
			}
			this.dispatchEvent(new CustomEvent("disconnected", { detail: error }));
			if (!this.isUnloading) this.reconnect();
		}
	};

	async disconnect(reconnect = true) {
		this.connectionGeneration++;

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
	};

	private startHelloWatchdog() {
		if (this.helloWatchdog) clearTimeout(this.helloWatchdog);
		this.helloWatchdog = setTimeout(() => {
			console.warn("Did not receive Hello in time. Retrying...");

			this.resumeGatewayURL = undefined;
			sessionStorage.removeItem("discord_resume_gateway_url");
			this.disconnect(true);
		}, this.helloTimeout);
	};

	private parseGatewayMessage(rawMessage: WebSocketMessage): GatewayMessage | null {
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
	};

	async gateway(rawMessage: WebSocketMessage) {
		if (rawMessage.type === "Close") {
			console.error("WebSocket connection closed:", rawMessage.data);
			const closeFrame = rawMessage.data;
			if (closeFrame && (closeFrame.code === 4004 || closeFrame.code === 4014)) {
				console.error(`Authentication failed (Close code: ${closeFrame.code}). Redirecting to login.`);
				this.resetAndRedirectToLogin();
				return;
			}
			this.disconnect(true);
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
							currentUser: message.data.user
						});

						this.dispatchEvent(new CustomEvent("ready"));
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

					case "RESUMED":
						console.info("Resumed");
						this.dispatchEvent(new CustomEvent("resumed"));
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
	};

	async fetchSettings(): Promise<ClientSettings> {
		const response = await this.rest.request("/users/@me/settings");
		this.settings = await response.json();
		return this.settings!;
	};

	async patchSettings(settings: Partial<ClientSettings>): Promise<ClientSettings> {
		const response = await this.rest.request("/users/@me/settings", {
			method: "PATCH",
			body: JSON.stringify(settings)
		});
		this.settings = await response.json();
		return this.settings!;
	};

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
	};

	private async sendHeartbeat() {
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
	};

	private async sendIdentify() {
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
	};

	private async sendResume() {
		this.dispatchEvent(new CustomEvent("disconnected"));
		this.send({
			op: 6,
			d: {
				token: this.token,
				session_id: this.sessionId,
				seq: this.sequence
			}
		});
	};
};