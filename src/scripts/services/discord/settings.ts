import { PreloadedUserSettings } from "discord-protos";

import { Color } from "/scripts/lib/utils.ts";
import { Snowflake } from "/scripts/services/discord/snowflake.ts";

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

export const ClientSettingsFriendDiscoveryFlags = {
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