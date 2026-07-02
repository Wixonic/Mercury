import WebSocket, { Message as WebSocketMessage } from "@tauri-apps/plugin-websocket";

import { PreloadedUserSettings } from "discord-protos";

import { Client, RestClient } from "/scripts/lib/client.ts";
import { store, type Session } from "/scripts/lib/store.ts";
import { join, fake, wait, Color } from "/scripts/lib/utils.ts";

import { Guild, GuildCollection } from "/scripts/services/discord/guild.ts";
import { Snowflake } from "/scripts/services/discord/snowflake.ts";
import { User, UserCollection } from "/scripts/services/discord/user.ts";

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



export enum GatewayOpCode {
	Dispatch = 0,
	Heartbeat = 1,
	Identify = 2,
	PresenceUpdate = 3,
	VoiceStateUpdate = 4,
	VoiceServerPing = 5,
	Resume = 6,
	Reconnect = 7,
	RequestGuildMembers = 8,
	InvalidSession = 9,
	Hello = 10,
	HeartbeatACK = 11,
	CallConnect = 13,
	LobbyVoiceStates = 17,
	StreamCreate = 18,
	StreamDelete = 19,
	StreamWatch = 20,
	StreamPing = 21,
	StreamSetPaused = 22,
	RequestForumUnreads = 28,
	RemoteCommand = 29,
	RequestDeletedEntityIDs = 30,
	RequestSoundboardSounds = 31,
	RequestLastMessages = 34,
	SearchRecentMembers = 35,
	GuildSubscriptionsBulk = 37,
	GuildChannelsResync = 38,
	RequestChannelMemberCount = 39,
	QoSHeartbeat = 40,
	UpdateTimeSpentSessionID = 41,
	LobbyVoiceServerPing = 42,
	RequestChannelInfo = 43
};

export enum GatewayDispatchEvent {
	Ready = "READY",
	ReadySupplemental = "READY_SUPPLEMENTAL",
	Resumed = "RESUMED",
	SessionsReplace = "SESSIONS_REPLACE",
	UserSettingsProtoUpdate = "USER_SETTINGS_PROTO_UPDATE",
	UserSettingsUpdate = "USER_SETTINGS_UPDATE",
	ApplicationCommandPermissionsUpdate = "APPLICATION_COMMAND_PERMISSIONS_UPDATE",
	AutoModerationRuleCreate = "AUTO_MODERATION_RULE_CREATE",
	AutoModerationRuleUpdate = "AUTO_MODERATION_RULE_UPDATE",
	AutoModerationRuleDelete = "AUTO_MODERATION_RULE_DELETE",
	AutoModerationActionExecution = "AUTO_MODERATION_ACTION_EXECUTION",
	ChannelCreate = "CHANNEL_CREATE",
	ChannelUpdate = "CHANNEL_UPDATE",
	ChannelDelete = "CHANNEL_DELETE",
	ChannelPinsUpdate = "CHANNEL_PINS_UPDATE",
	ThreadCreate = "THREAD_CREATE",
	ThreadUpdate = "THREAD_UPDATE",
	ThreadDelete = "THREAD_DELETE",
	ThreadListSync = "THREAD_LIST_SYNC",
	ThreadMemberUpdate = "THREAD_MEMBER_UPDATE",
	ThreadMembersUpdate = "THREAD_MEMBERS_UPDATE",
	GuildCreate = "GUILD_CREATE",
	GuildUpdate = "GUILD_UPDATE",
	GuildDelete = "GUILD_DELETE",
	GuildBanAdd = "GUILD_BAN_ADD",
	GuildBanRemove = "GUILD_BAN_REMOVE",
	GuildEmojisUpdate = "GUILD_EMOJIS_UPDATE",
	GuildStickersUpdate = "GUILD_STICKERS_UPDATE",
	GuildIntegrationsUpdate = "GUILD_INTEGRATIONS_UPDATE",
	GuildMemberAdd = "GUILD_MEMBER_ADD",
	GuildMemberUpdate = "GUILD_MEMBER_UPDATE",
	GuildMemberRemove = "GUILD_MEMBER_REMOVE",
	GuildMembersChunk = "GUILD_MEMBERS_CHUNK",
	GuildRoleCreate = "GUILD_ROLE_CREATE",
	GuildRoleUpdate = "GUILD_ROLE_UPDATE",
	GuildRoleDelete = "GUILD_ROLE_DELETE",
	GuildScheduledEventCreate = "GUILD_SCHEDULED_EVENT_CREATE",
	GuildScheduledEventUpdate = "GUILD_SCHEDULED_EVENT_UPDATE",
	GuildScheduledEventDelete = "GUILD_SCHEDULED_EVENT_DELETE",
	GuildScheduledEventUserAdd = "GUILD_SCHEDULED_EVENT_USER_ADD",
	GuildScheduledEventUserRemove = "GUILD_SCHEDULED_EVENT_USER_REMOVE",
	GuildAuditLogEntryCreate = "GUILD_AUDIT_LOG_ENTRY_CREATE",
	IntegrationCreate = "INTEGRATION_CREATE",
	IntegrationUpdate = "INTEGRATION_UPDATE",
	IntegrationDelete = "INTEGRATION_DELETE",
	InviteCreate = "INVITE_CREATE",
	InviteDelete = "INVITE_DELETE",
	MessageCreate = "MESSAGE_CREATE",
	MessageUpdate = "MESSAGE_UPDATE",
	MessageDelete = "MESSAGE_DELETE",
	MessageDeleteBulk = "MESSAGE_DELETE_BULK",
	MessageReactionAdd = "MESSAGE_REACTION_ADD",
	MessageReactionRemove = "MESSAGE_REACTION_REMOVE",
	MessageReactionRemoveAll = "MESSAGE_REACTION_REMOVE_ALL",
	MessageReactionRemoveEmoji = "MESSAGE_REACTION_REMOVE_EMOJI",
	PresenceUpdate = "PRESENCE_UPDATE",
	StageInstanceCreate = "STAGE_INSTANCE_CREATE",
	StageInstanceUpdate = "STAGE_INSTANCE_UPDATE",
	StageInstanceDelete = "STAGE_INSTANCE_DELETE",
	TypingStart = "TYPING_START",
	UserUpdate = "USER_UPDATE",
	VoiceStateUpdate = "VOICE_STATE_UPDATE",
	VoiceServerUpdate = "VOICE_SERVER_UPDATE",
	WebhooksUpdate = "WEBHOOKS_UPDATE",
	InteractionCreate = "INTERACTION_CREATE",
	EntitlementCreate = "ENTITLEMENT_CREATE",
	EntitlementUpdate = "ENTITLEMENT_UPDATE",
	EntitlementDelete = "ENTITLEMENT_DELETE",
	GuildMemberListUpdate = "GUILD_MEMBER_LIST_UPDATE",
	CallCreate = "CALL_CREATE",
	CallUpdate = "CALL_UPDATE",
	CallDelete = "CALL_DELETE",
	ChannelRecipientAdd = "CHANNEL_RECIPIENT_ADD",
	ChannelRecipientRemove = "CHANNEL_RECIPIENT_REMOVE",
	FriendSuggestionCreate = "FRIEND_SUGGESTION_CREATE",
	FriendSuggestionDelete = "FRIEND_SUGGESTION_DELETE",
	UserConnectionsUpdate = "USER_CONNECTIONS_UPDATE",
	UserNoteUpdate = "USER_NOTE_UPDATE",
	UserRequiredActionUpdate = "USER_REQUIRED_ACTION_UPDATE",
	RelationshipAdd = "RELATIONSHIP_ADD",
	RelationshipRemove = "RELATIONSHIP_REMOVE",
	PresenceReplace = "PRESENCE_REPLACE",
	GuildJoinRequestCreate = "GUILD_JOIN_REQUEST_CREATE",
	GuildJoinRequestUpdate = "GUILD_JOIN_REQUEST_UPDATE",
	GuildJoinRequestDelete = "GUILD_JOIN_REQUEST_DELETE",
	RecentMentionDelete = "RECENT_MENTION_DELETE"
};

export enum GatewayCloseCode {
	UnknownError = 4000,
	UnknownOpcode = 4001,
	DecodeError = 4002,
	NotAuthenticated = 4003,
	AuthenticationFailed = 4004,
	AlreadyAuthenticated = 4005,
	InvalidSeq = 4007,
	RateLimited = 4008,
	SessionTimeout = 4009,
	InvalidShard = 4010,
	ShardingRequired = 4011,
	InvalidApiVersion = 4012,
	InvalidIntents = 4013,
	DisallowedIntents = 4014
};

const GatewayIntents = {
	LazyUserNotes: 1n << 0n,
	NoAffineUserIds: 1n << 1n,
	VersionedReadStates: 1n << 2n,
	VersionedUserGuildSettings: 1n << 3n,
	DedupeUserObjects: 1n << 4n,
	PrioritizedReadyPayload: 1n << 5n,
	MultipleGuildExperimentPopulations: 1n << 6n,
	NonChannelReadStates: 1n << 7n,
	AuthTokenRefresh: 1n << 8n,
	UserSettingsProto: 1n << 9n,
	ClientStateV2: 1n << 10n,
	PassiveGuildUpdate: 1n << 11n,
	AutoCallConnect: 1n << 12n,
	DebounceMessageReactions: 1n << 13n,
	PassiveGuildUpdateV2: 1n << 14n,
	ChannelObfuscation: 1n << 15n,
	AutoLobbyConnect: 1n << 16n
} as const;
export type GatewayIntents = typeof GatewayIntents[keyof typeof GatewayIntents];



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

				gatewayURL = gatewayData.url;
				console.log("Gateway response data:", gatewayData);
			} else console.log("Using cached resume gateway URL:", gatewayURL);

			try {
				const ws = await WebSocket.connect(join(gatewayURL!, "?v=9&encoding=json"), {
					headers: {
						"Origin": "https://discord.com",
						"User-Agent": fake.browser_user_agent
					}
				});

				if (generation !== this.connectionGeneration) {
					ws.disconnect().catch((error) => console.error("Failed to disconnect WebSocket:", error));
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

	self<Cached extends boolean = false>(force?: boolean, cached?: Cached): Cached extends true ? User<true> | undefined : Promise<User<true>> {
		const self = this.users.cached().get("@me");
		if (cached) return self as any;

		return this.users.get("@me", force, cached as any).then((self) => {
			this.id = self!.id;
			return self!;
		}) as any;
	};

	private async resetAndRedirectToLogin() {
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

		await this.disconnect(false).catch((error) => console.error("Failed to disconnect WebSocket:", error));
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
				await ws.disconnect().catch((error) => console.error("Failed to disconnect WebSocket:", error));
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
			if (closeFrame && (closeFrame.code === GatewayCloseCode.AuthenticationFailed || closeFrame.code === GatewayCloseCode.DisallowedIntents)) {
				console.error(`Authentication failed (Close code: ${closeFrame.code}). Redirecting to login.`);
				this.resetAndRedirectToLogin();
				return;
			}

			this.ws = undefined;
			await this.disconnect(true).catch((error) => console.error("Failed to disconnect WebSocket:", error));
			return;
		}

		const message = this.parseGatewayMessage(rawMessage);
		if (!message) return;

		switch (message.code) {
			case GatewayOpCode.Dispatch:
				this.sequence = message.sequence;
				if (this.sequence) sessionStorage.setItem("discord_sequence", this.sequence.toString());

				if (message.event) this.dispatchEvent(new CustomEvent(message.event, { detail: message.data }));

				switch (message.event) {
					case GatewayDispatchEvent.Ready:
						this.sessionId = message.data.session_id;
						this.resumeGatewayURL = message.data.resume_gateway_url;

						sessionStorage.setItem("discord_session_id", this.sessionId!);
						sessionStorage.setItem("discord_resume_gateway_url", this.resumeGatewayURL!);

						this.settings = parseClientSettings(PreloadedUserSettings.fromBase64(message.data.user_settings_proto));

						const self = new User(message.data.user);
						this.users.set("@me", self);
						this.users.set(self.id, self);
						this.id = self.id;

						if (message.data.users) {
							for (const userData of message.data.users) this.users.set(userData.id, new User(userData));
						}

						if (message.data.relationships) {
							for (const relationship of message.data.relationships) {
								if (relationship.user) this.users.set(relationship.user.id, new User(relationship.user));
							}
						}

						for (const guildData of message.data.guilds) this.guilds.set(guildData.id, new Guild(guildData));

						console.info("Ready - Session ID:", this.sessionId);

						store.setState({
							currentUser: message.data.user
						});

						this.dispatchEvent(new CustomEvent("ready"));
						break;

					case GatewayDispatchEvent.SessionsReplace:
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

					case GatewayDispatchEvent.Resumed:
						console.info("Resumed");
						this.dispatchEvent(new CustomEvent("resumed"));
						break;

					default:
						console.warn("Unhandled dispatch event:", message.event, "with data:", message.data);
						break;
				}
				break;

			case GatewayOpCode.Reconnect:
				console.warn("Reconnect requested by server");
				await this.disconnect().catch((error) => console.error("Failed to disconnect WebSocket:", error));
				break;

			case GatewayOpCode.InvalidSession:
				console.warn("Invalid Session");

				if (message.data !== true) {
					this.sessionId = undefined;
					this.sequence = undefined;
					this.resumeGatewayURL = undefined;
					sessionStorage.removeItem("discord_session_id");
					sessionStorage.removeItem("discord_sequence");
					sessionStorage.removeItem("discord_resume_gateway_url");
				}

				await this.disconnect(true).catch((error) => console.error("Failed to disconnect WebSocket:", error));
				break;

			case GatewayOpCode.Hello:
				if (this.helloWatchdog) {
					clearTimeout(this.helloWatchdog);
					this.helloWatchdog = undefined;
				}

				this.sendHeartbeat();
				this.heartbeat = setInterval(() => this.sendHeartbeat(), message.data.heartbeat_interval);

				if (this.sessionId && this.sequence != null && this.resumeGatewayURL && this.token) this.sendResume();
				else if (this.token) this.sendIdentify();
				break;

			case GatewayOpCode.HeartbeatACK:
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

	awaitEvent<Type = any>(eventName: string, check?: (data: Type) => boolean, timeout = 5000): Promise<Type> {
		return new Promise((resolve, reject) => {
			const timer = setTimeout(() => {
				cleanup();
				reject(new Error(`Timeout waiting for event ${eventName}`));
			}, timeout);

			const handler = (event: Event) => {
				const data = (event as CustomEvent).detail;
				if (!check || check(data)) {
					cleanup();
					resolve(data);
				}
			};

			const cleanup = () => {
				clearTimeout(timer);
				this.removeEventListener(eventName, handler);
			};

			this.addEventListener(eventName, handler);
		});
	};

	async requestGuildMembers(guildId: Snowflake, query = "", limit = 0, userIds?: Snowflake[]): Promise<any[]> {
		const nonce = Math.random().toString(36).substring(2, 15);

		try {
			this.send({
				op: GatewayOpCode.RequestGuildMembers,
				d: {
					guild_id: guildId,
					query,
					limit,
					user_ids: userIds,
					nonce
				}
			});

			const response = await this.awaitEvent("GUILD_MEMBERS_CHUNK", (data) => data.nonce === nonce);
			return response.members;
		} catch (error) {
			console.warn("Gateway requestGuildMembers timed out or failed, falling back to REST:", error);
			if (userIds && userIds.length > 0) {
				const results = await Promise.all(
					userIds.map(async (id) => {
						try {
							const response = await this.rest.request(`/guilds/${guildId}/members/${id}`);
							return await response.json();
						} catch {
							return null;
						}
					})
				);
				return results.filter(Boolean);
			} else {
				const url = `/guilds/${guildId}/members?limit=${limit || 1000}${query ? `&query=${encodeURIComponent(query)}` : ""}`;
				const response = await this.rest.request(url);
				return await response.json();
			}
		}
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
			await this.disconnect().catch((error) => console.error("Failed to disconnect WebSocket:", error));
			return;
		}

		this.heartbeatTimestamp = performance.now();
		this.send({
			op: GatewayOpCode.Heartbeat,
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
			op: GatewayOpCode.Identify,
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
				intents: GatewayIntents.UserSettingsProto
			}
		});
	};

	private async sendResume() {
		this.send({
			op: GatewayOpCode.Resume,
			d: {
				token: this.token,
				session_id: this.sessionId,
				seq: this.sequence ?? null
			}
		});
	};
};