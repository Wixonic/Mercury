import { PreloadedUserSettings, PreloadedUserSettings_GuildSettings, PreloadedUserSettings_ChannelSettings } from "discord-protos";

export type ClientSettings = PreloadedUserSettings;
export type GuildSettings = PreloadedUserSettings_GuildSettings;
export type ChannelSettings = PreloadedUserSettings_ChannelSettings;

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