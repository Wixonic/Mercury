import WebSocket, { Message as WebSocketMessage } from "@tauri-apps/plugin-websocket";

import { PreloadedUserSettings } from "discord-protos";

import { Client, RestClient } from "/scripts/lib/client.ts";
import { store, type Session } from "/scripts/lib/store.ts";
import { join, fake, wait, Color } from "/scripts/lib/utils.ts";

import { GuildCollection } from "/scripts/services/discord/guild.ts";
import { Snowflake } from "/scripts/services/discord/snowflake.ts";
import { UserCollection } from "/scripts/services/discord/user.ts";

type GatewayMessage = {
	code: number;
	data: any;
	sequence?: number;
	event?: string;
};

type DateKey =
	| "lastDismissedAtMs" | "guildRecentsDismissedAt" | "premiumTier0ModalDismissedAt"
	| "guildOnboardingUpsellDismissedAt" | "safetyUserSentimentNoticeDismissedAt"
	| "lastGiftIntentDismissedAtMs" | "focusModeExpiresAtMs" | "expiresAtMs"
	| "createdAtMs" | "statusExpiresAtMs" | "statusCreatedAtMs" | "modifiedAt"
	| "feedGeneratedAt" | "lastImpressionTime" | "optOutExpiryTime";

type ColorKey = "color";

type SnowflakeKey =
	| "id" | "emojiId" | "lastReceivedChangelogId" | "notificationCenterAckedBeforeId"
	| "parentId" | "soundId" | "guildId" | "lastDismissedObjectId";

type Unwrap<T, K> =
	T extends Uint8Array ? Uint8Array :
	T extends Date ? Date :
	T extends { seconds: bigint, nanos: number } ? Date :
	T extends { value: infer V } ? (V extends bigint ? Snowflake : V) :
	T extends bigint ? (K extends SnowflakeKey ? Snowflake : bigint) :
	T extends bigint[] ? Snowflake[] :
	T extends (infer U)[] ? DeepParsed<U>[] :
	T extends object ? DeepParsed<T> :
	T;

export type DeepParsed<T> = {
	[K in keyof T]:
	K extends ColorKey ? Color :
	K extends DateKey ? Date :
	Unwrap<T[K], K>
};

export type ClientSettings = DeepParsed<PreloadedUserSettings>;

const dateKeys: string[] = [
	"lastDismissedAtMs", "guildRecentsDismissedAt", "premiumTier0ModalDismissedAt",
	"guildOnboardingUpsellDismissedAt", "safetyUserSentimentNoticeDismissedAt",
	"lastGiftIntentDismissedAtMs", "focusModeExpiresAtMs", "expiresAtMs",
	"createdAtMs", "statusExpiresAtMs", "statusCreatedAtMs", "modifiedAt",
	"feedGeneratedAt", "lastImpressionTime", "optOutExpiryTime"
];

const colorKeys: string[] = [
	"color"
];

const snowflakeKeys: string[] = [
	"id", "emojiId", "lastReceivedChangelogId", "notificationCenterAckedBeforeId",
	"parentId", "soundId", "guildId", "lastDismissedObjectId"
];

const snowflakeArrayKeys: string[] = [
	"guildIds", "guildPositions", "allowedGuildIds", "allowedUserIds",
	"restrictedGuildIds", "activityRestrictedGuildIds", "activityJoiningRestrictedGuildIds",
	"messageRequestRestrictedGuildIds"
];

const wrapperKeys: string[] = [
	"id", "name", "color", "status", "showCurrentGame", "locale", "timezoneOffset", "timezoneName",
	"backgroundGradientPresetId", "channelListLayout", "messagePreviews", "searchResultExactCountEnabled",
	"happeningNowCardsDisabled", "guildVisible", "alwaysPreviewVideo", "afkTimeout", "streamNotificationsEnabled",
	"nativePhoneIntegrationEnabled", "disableStreamPreviews", "soundmojiVolume", "profanity", "sexualContent",
	"slurs", "emojiId", "emojiName", "animated", "disableDoubleTap", "lastDismissedOutboundPromotionStartDate",
	"allowActivityPartyPrivacyFriends", "allowActivityPartyPrivacyVoiceChannel", "detectPlatformAccounts",
	"passwordless", "contactSyncEnabled", "friendSourceFlags", "friendDiscoveryFlags", "defaultMessageRequestRestricted",
	"dropsOptedOut", "nonSpamRetrainingOptIn", "familyCenterEnabled", "familyCenterEnabledV2", "hideLegacyUsername",
	"inappropriateConversationWarnings", "recentGamesEnabled", "allowGameFriendDmsInDiscord", "defaultGuildsRestrictedV2",
	"quests3PDataOptedOut", "showLocalTime", "hideFriendRequestNotes", "rtcPanelShowVoiceStates", "installShortcutDesktop",
	"installShortcutStartMenu", "disableGamesTab", "disableHomeAutoNav", "allowFriends", "autoBroadcast", "allowVoiceRecording",
	"lastImpressionTime", "optOutExpiryTime", "statusCreatedAtMs"
];

export const deepUnwrap = (value: any, key?: string): any => {
	if (value === null || value === undefined || value instanceof Uint8Array || value instanceof Date) return value;

	if (typeof value === "object" && "value" in value && Object.keys(value).length === 1) {
		value = value.value;
		if (value === null || value === undefined) return value;
	}

	if (key && dateKeys.includes(key)) {
		if (typeof value === "bigint" || typeof value === "number") return new Date(Number(value));
		if (typeof value === "object" && "seconds" in value) return new Date(Number(value.seconds) * 1000);
	}

	if (key && colorKeys.includes(key)) {
		if (value !== undefined && value !== null) return new Color(Number(value));
		return undefined;
	}

	if (typeof value === "bigint") return value.toString();
	if (Array.isArray(value)) return value.map((item) => deepUnwrap(item, key));

	if (typeof value === "object") {
		if ("seconds" in value && "nanos" in value) return new Date(Number(value.seconds) * 1000);

		const result: any = {};
		for (const childKey of Object.keys(value)) result[childKey] = deepUnwrap(value[childKey], childKey);
		return result;
	}

	return value;
};

export const deepWrap = (value: any, key?: string, parentKey?: string): any => {
	if (value === null || value === undefined) return value;

	if (value instanceof Date) {
		if (key === "statusCreatedAtMs" || key === "lastImpressionTime" || key === "optOutExpiryTime") {
			return { value: BigInt(value.getTime()) };
		}
		if (key === "guildRecentsDismissedAt" || key === "premiumTier0ModalDismissedAt" || key === "guildOnboardingUpsellDismissedAt" || key === "safetyUserSentimentNoticeDismissedAt") {
			return { seconds: BigInt(Math.floor(value.getTime() / 1000)), nanos: 0 };
		}
		return BigInt(value.getTime());
	}

	if (value instanceof Color) {
		if (key === "color") return { value: BigInt(value.toJSON()) };
		return BigInt(value.toJSON());
	}

	if (key && wrapperKeys.includes(key)) {
		if (key === "id" && parentKey === "customAsset" && typeof value === "string") return BigInt(value);
		if (key === "id" && typeof value === "string") return { value: BigInt(value) };
		if (key === "color") return { value: BigInt(value.toJSON()) };
		if (key === "emojiId" && parentKey === "customStatus" && typeof value === "string") return BigInt(value);
		if (key === "emojiId" && typeof value === "string") return { value: BigInt(value) };
		return { value };
	}

	if (key && snowflakeKeys.includes(key) && typeof value === "string") {
		return BigInt(value);
	}

	if (key && snowflakeArrayKeys.includes(key) && Array.isArray(value)) {
		return value.map((id: any) => BigInt(id));
	}

	if (Array.isArray(value)) return value.map((item) => deepWrap(item, key, parentKey));

	if (typeof value === "object") {
		const result: any = {};
		for (const childKey of Object.keys(value)) result[childKey] = deepWrap(value[childKey], childKey, key);
		return result;
	}

	return value;
};

export const parseClientSettings = (data: any): ClientSettings => {
	return deepUnwrap(data);
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

export class DiscordClient extends Client {
	rest: RestClient;
	ws?: WebSocket;

	guilds = new GuildCollection();
	users = new UserCollection();

	private heartbeat?: ReturnType<typeof setInterval>;
	private heartbeatTimestamp?: number;
	ping?: number;

	token?: string;
	sessionId?: string;
	private resumeGatewayURL?: string;
	private sequence?: number;
	isUnloading = false;
	private isReconnecting = false;
	private helloWatchdog?: ReturnType<typeof setTimeout>;
	private unlistenGateway?: (() => void);
	private connectionGeneration = 0;

	id?: Snowflake;
	settings?: ClientSettings;

	private helloTimeout = 3000;

	constructor(restBaseURL: URL) {
		super();
		this.rest = new RestClient(restBaseURL);

		this.sessionId = sessionStorage.getItem("discord_session_id") ?? undefined;
		this.resumeGatewayURL = sessionStorage.getItem("discord_resume_gateway_url") ?? undefined;
		const sequence = sessionStorage.getItem("discord_sequence");
		if (sequence) this.sequence = parseInt(sequence, 10);
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
				const listenerGeneration = generation;
				this.unlistenGateway = this.ws.addListener((message) => {
					if (listenerGeneration !== this.connectionGeneration) return;
					this.gateway(message);
				});
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

	async self(force?: boolean, cached?: boolean) {
		const self = await this.users.get("@me", force, cached);
		this.id = self!.id;
		return self;
	};

	private resetAndRedirectToLogin() {
		this.token = undefined;
		this.sessionId = undefined;
		this.sequence = undefined;
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
		if (this.isUnloading) return;
		if (this.isReconnecting) return;
		this.isReconnecting = true;

		this.dispatchEvent(new CustomEvent("connecting"));

		const generation = ++this.connectionGeneration;

		try {
			const gatewayURL = this.resumeGatewayURL ?? (await (await this.rest.request("/gateway")).json()).url;
			if (generation !== this.connectionGeneration) { this.isReconnecting = false; return; }

			const ws = await WebSocket.connect(join(gatewayURL, "?v=9&encoding=json"), {
				headers: {
					"Origin": "https://discord.com",
					"User-Agent": fake.browser_user_agent
				}
			});
			if (generation !== this.connectionGeneration) {
				ws.disconnect().catch(console.error);
				this.isReconnecting = false;
				return;
			}
			this.ws = ws;
			const listenerGeneration = generation;
			this.unlistenGateway = this.ws.addListener((message) => {
				if (listenerGeneration !== this.connectionGeneration) return;
				this.gateway(message);
			});
			this.isReconnecting = false;
			this.startHelloWatchdog();
		} catch (error: any) {
			console.error("Failed to reconnect:", error);
			this.isReconnecting = false;
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
		this.isReconnecting = false;

		this.dispatchEvent(new CustomEvent("disconnected"));

		if (this.heartbeat) clearInterval(this.heartbeat);
		this.heartbeat = undefined;
		this.heartbeatTimestamp = undefined;
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
					wait(this.isUnloading ? 1500 : 500)
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
			this.ws = undefined;
			this.disconnect(true);
			return;
		}

		const message = this.parseGatewayMessage(rawMessage);
		if (!message) return;

		switch (message.code) {
			case 0: // Dispatch
				this.sequence = message.sequence;
				if (this.sequence) sessionStorage.setItem("discord_sequence", this.sequence.toString());

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
				if (message.data !== true) {
					this.sessionId = undefined;
					this.sequence = undefined;
					this.resumeGatewayURL = undefined;
					sessionStorage.removeItem("discord_session_id");
					sessionStorage.removeItem("discord_sequence");
					sessionStorage.removeItem("discord_resume_gateway_url");
				}
				this.disconnect(true);
				break;

			case 10: // Hello
				if (this.helloWatchdog) {
					clearTimeout(this.helloWatchdog);
					this.helloWatchdog = undefined;
				}
				this.sendHeartbeat();
				this.heartbeat = setInterval(() => this.sendHeartbeat(), message.data.heartbeat_interval);

				if (this.sessionId && this.sequence != null && this.resumeGatewayURL && this.token) this.sendResume();
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
		const response = await this.rest.request("/users/@me/settings-proto/1");
		const data = await response.json();
		this.settings = parseClientSettings(PreloadedUserSettings.fromBase64(data.settings));
		return this.settings!;
	};

	async patchSettings(settings: Partial<ClientSettings>): Promise<ClientSettings> {
		const response = await this.rest.request("/users/@me/settings-proto/1", {
			method: "PATCH",
			body: JSON.stringify({
				settings: PreloadedUserSettings.toBase64(deepWrap(settings)),
				required_data_version: this.settings?.versions?.dataVersion
			})
		});
		const data = await response.json();
		this.settings = parseClientSettings(PreloadedUserSettings.fromBase64(data.settings));
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
			d: this.sequence ?? null
		});
	};

	private async sendIdentify() {
		const identifyGeneration = this.connectionGeneration;
		const lastIdentify = sessionStorage.getItem("discord_last_identify");
		if (lastIdentify && (Date.now() - parseInt(lastIdentify, 10)) < 5000) await wait(5000 - (Date.now() - parseInt(lastIdentify, 10)));
		if (identifyGeneration !== this.connectionGeneration) return;

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
		this.send({
			op: 6,
			d: {
				token: this.token,
				session_id: this.sessionId,
				seq: this.sequence ?? null
			}
		});
	};
};