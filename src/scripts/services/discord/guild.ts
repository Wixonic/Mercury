import { Color, Collection, PartialType } from "/scripts/lib/utils.ts";

import { CDNElement } from "/scripts/services/discord/cdn.ts";
import { Channel, ChannelCollection } from "/scripts/services/discord/channel.ts";
import { EmojiCollection } from "/scripts/services/discord/emoji.ts";
import { RoleCollection } from "/scripts/services/discord/role.ts";
import { StickerCollection } from "/scripts/services/discord/sticker.ts";
import type { Snowflake } from "/scripts/services/discord/snowflake.ts";

import { discordClient } from "/main.ts";
import { GuildSettings } from "/scripts/services/discord/settings.ts";

export enum GuildVerificationLevel {
	None = 0,
	Low = 1,
	Medium = 2,
	High = 3,
	VeryHigh = 4
};

export enum GuildMessageNotificationLevel {
	AllMessages = 0,
	OnlyMentions = 1,
	NoMessages = 2,
	Inherit = 3,
};

export enum GuildExplicitContentFilterLevel {
	Disabled = 0,
	MemberWithoutRoles = 1,
	AllMembers = 2
};

export enum GuildFeature {
	ActivitiesAlpha = "ACTIVITIES_ALPHA",
	ActivitiesEmployee = "ACTIVITIES_EMPLOYEE",
	ActivitiesInternalDev = "ACTIVITIES_INTERNAL_DEV",
	ActivityFeedDisabledByUser = "ACTIVITY_FEED_DISABLED_BY_USER",
	ActivityFeedEnabledByUser = "ACTIVITY_FEED_ENABLED_BY_USER",
	AgeVerificationLargeGuild = "AGE_VERIFICATION_LARGE_GUILD",
	AnimatedBanner = "ANIMATED_BANNER",
	AnimatedIcon = "ANIMATED_ICON",
	AudioBitrate128Kbps = "AUDIO_BITRATE_128_KBPS",
	AudioBitrate256Kbps = "AUDIO_BITRATE_256_KBPS",
	AudioBitrate384Kbps = "AUDIO_BITRATE_384_KBPS",
	AutoModeration = "AUTO_MODERATION",
	Banner = "BANNER",
	Bfg = "BFG",
	BotDeveloperEarlyAccess = "BOT_DEVELOPER_EARLY_ACCESS",
	BypassSlowmodePermissionMigrationComplete = "BYPASS_SLOWMODE_PERMISSION_MIGRATION_COMPLETE",
	ChannelEmojisGenerated = "CHANNEL_EMOJIS_GENERATED",
	ChannelIconEmojisGenerated = "CHANNEL_ICON_EMOJIS_GENERATED",
	Commerce = "COMMERCE",
	Community = "COMMUNITY",
	CommunityCanary = "COMMUNITY_CANARY",
	CommunityExpLargeGated = "COMMUNITY_EXP_LARGE_GATED",
	CommunityExpLargeUngated = "COMMUNITY_EXP_LARGE_UNGATED",
	CommunityExpMedium = "COMMUNITY_EXP_MEDIUM",
	Conference = "CONFERENCE",
	ConsideredExternallyDiscoverable = "CONSIDERED_EXTERNALLY_DISCOVERABLE",
	CreatorMonetizable = "CREATOR_MONETIZABLE",
	CreatorMonetizableDisabled = "CREATOR_MONETIZABLE_DISABLED",
	CreatorMonetizablePendingNewOwnerOnboarding = "CREATOR_MONETIZABLE_PENDING_NEW_OWNER_ONBOARDING",
	CreatorMonetizableProvisional = "CREATOR_MONETIZABLE_PROVISIONAL",
	CreatorMonetizableRestricted = "CREATOR_MONETIZABLE_RESTRICTED",
	CreatorMonetizableWhiteglove = "CREATOR_MONETIZABLE_WHITEGLOVE",
	CreatorMonetizationApplicationAllowlist = "CREATOR_MONETIZATION_APPLICATION_ALLOWLIST",
	CreatorStorePage = "CREATOR_STORE_PAGE",
	DeveloperSupportServer = "DEVELOPER_SUPPORT_SERVER",
	Discoverable = "DISCOVERABLE",
	DiscoverableDisabled = "DISCOVERABLE_DISABLED",
	EnabledDiscoverableBefore = "ENABLED_DISCOVERABLE_BEFORE",
	EnabledModerationExperienceForNonCommunity = "ENABLED_MODERATION_EXPERIENCE_FOR_NON_COMMUNITY",
	EnhancedRoleColors = "ENHANCED_ROLE_COLORS",
	ExposedToActivitiesWtpExperiment = "EXPOSED_TO_ACTIVITIES_WTP_EXPERIMENT",
	ForwardingDisabled = "FORWARDING_DISABLED",
	GameServerHosting = "GAME_SERVER_HOSTING",
	GameServers = "GAME_SERVERS",
	GuestsEnabled = "GUESTS_ENABLED",
	GuildOnboarding = "GUILD_ONBOARDING",
	GuildOnboardingEverEnabled = "GUILD_ONBOARDING_EVER_ENABLED",
	GuildOnboardingHasPrompts = "GUILD_ONBOARDING_HAS_PROMPTS",
	GuildProducts = "GUILD_PRODUCTS",
	GuildProductsAllowArchivedFile = "GUILD_PRODUCTS_ALLOW_ARCHIVED_FILE",
	GuildServerGuide = "GUILD_SERVER_GUIDE",
	GuildTags = "GUILD_TAGS",
	GuildTagsBadgePackCreepyCrawlies = "GUILD_TAGS_BADGE_PACK_CREEPY_CRAWLIES",
	GuildTagsBadgePackFlex = "GUILD_TAGS_BADGE_PACK_FLEX",
	GuildTagsBadgePackPets = "GUILD_TAGS_BADGE_PACK_PETS",
	GuildTagsBadgePackPlant = "GUILD_TAGS_BADGE_PACK_PLANT",
	GuildWebPageVanityUrl = "GUILD_WEB_PAGE_VANITY_URL",
	HadEarlyActivitiesAccess = "HAD_EARLY_ACTIVITIES_ACCESS",
	HasDirectoryEntry = "HAS_DIRECTORY_ENTRY",
	HideFromExperimentUi = "HIDE_FROM_EXPERIMENT_UI",
	Hub = "HUB",
	IncreasedThreadLimit = "INCREASED_THREAD_LIMIT",
	InternalEmployeeOnly = "INTERNAL_EMPLOYEE_ONLY",
	InviteSplash = "INVITE_SPLASH",
	InvitesDisabled = "INVITES_DISABLED",
	LinkedToHub = "LINKED_TO_HUB",
	MaxFileSize50Mb = "MAX_FILE_SIZE_50_MB",
	MaxFileSize100Mb = "MAX_FILE_SIZE_100_MB",
	MaxFileSize250Mb = "MAX_FILE_SIZE_250_MB",
	MemberVerificationGateEnabled = "MEMBER_VERIFICATION_GATE_ENABLED",
	MemberVerificationManualApproval = "MEMBER_VERIFICATION_MANUAL_APPROVAL",
	MoreEmoji = "MORE_EMOJI",
	MoreSoundboard = "MORE_SOUNDBOARD",
	MoreStickers = "MORE_STICKERS",
	News = "NEWS",
	NonCommunityRaidAlerts = "NON_COMMUNITY_RAID_ALERTS",
	OfficialGameGuild = "OFFICIAL_GAME_GUILD",
	Partnered = "PARTNERED",
	PinPermissionMigrationComplete = "PIN_PERMISSION_MIGRATION_COMPLETE",
	PowerupBetaFeatures = "POWERUP_BETA_FEATURES",
	PremiumTier3Override = "PREMIUM_TIER_3_OVERRIDE",
	PreviewEnabled = "PREVIEW_ENABLED",
	ProductsAvailableForPurchase = "PRODUCTS_AVAILABLE_FOR_PURCHASE",
	RaidAlertsDisabled = "RAID_ALERTS_DISABLED",
	RelayEnabled = "RELAY_ENABLED",
	ReportToModPilot = "REPORT_TO_MOD_PILOT",
	ReportToModSurvey = "REPORT_TO_MOD_SURVEY",
	RoleIcons = "ROLE_ICONS",
	RoleSubscriptionsAvailableForPurchase = "ROLE_SUBSCRIPTIONS_AVAILABLE_FOR_PURCHASE",
	RoleSubscriptionsEnabled = "ROLE_SUBSCRIPTIONS_ENABLED",
	SharedCanvasFriendsAndFamilyTest = "SHARED_CANVAS_FRIENDS_AND_FAMILY_TEST",
	SocialLayerStorefront = "SOCIAL_LAYER_STOREFRONT",
	Soundboard = "SOUNDBOARD",
	StageChannelViewers50 = "STAGE_CHANNEL_VIEWERS_50",
	StageChannelViewers150 = "STAGE_CHANNEL_VIEWERS_150",
	StageChannelViewers300 = "STAGE_CHANNEL_VIEWERS_300",
	SummariesEnabledGa = "SUMMARIES_ENABLED_GA",
	SummariesDisabledByUser = "SUMMARIES_DISABLED_BY_USER",
	SummariesEnabledByUser = "SUMMARIES_ENABLED_BY_USER",
	SummariesLongLookback = "SUMMARIES_LONG_LOOKBACK",
	SummariesOptOutExperience = "SUMMARIES_OPT_OUT_EXPERIENCE",
	StaffLevelCollaboratorRequired = "STAFF_LEVEL_COLLABORATOR_REQUIRED",
	StaffLevelRestrictedCollaboratorRequired = "STAFF_LEVEL_RESTRICTED_COLLABORATOR_REQUIRED",
	TierlessBoosting = "TIERLESS_BOOSTING",
	TierlessBoostingSystemMessage = "TIERLESS_BOOSTING_SYSTEM_MESSAGE",
	VanityUrl = "VANITY_URL",
	Verified = "VERIFIED",
	VideoBitrateEnhanced = "VIDEO_BITRATE_ENHANCED",
	VideoQuality72060fps = "VIDEO_QUALITY_720_60FPS",
	VideoQuality108060fps = "VIDEO_QUALITY_1080_60FPS",
	VipRegions = "VIP_REGIONS",
	VoiceInThreads = "VOICE_IN_THREADS",
	WelcomeScreenEnabled = "WELCOME_SCREEN_ENABLED"
};

export enum GuildMfaLevel {
	None = 0,
	Elevated = 1
};

export const GuildSystemChannelFlags = {
	SuppressJoinNotifications: 1n << 0n,
	SuppressPremiumSubscriptions: 1n << 1n,
	SuppressGuildReminderNotifications: 1n << 2n,
	SuppressJoinNotificationReplies: 1n << 3n,
	SuppressRoleSubscriptionPurchaseNotifications: 1n << 4n,
	SuppressRoleSubscriptionPurchaseReplies: 1n << 5n,
	SuppressChannelPromptDeadchat: 1n << 7n,
	SuppressUgcAddedNotifications: 1n << 8n
} as const;
export type GuildSystemChannelFlags = typeof GuildSystemChannelFlags[keyof typeof GuildSystemChannelFlags];

export enum GuildPremiumTier {
	None = 0,
	Tier1 = 1,
	Tier2 = 2,
	Tier3 = 3,
};

export enum GuildNsfwLevel {
	Default = 0,
	Explicit = 1,
	Safe = 2,
	AgeRestricted = 3,
};

export enum GuildHubType {
	Default = 0,
	HighSchool = 1,
	College = 2
};

export interface GuildAutomodIncidentsData {
	raid_detected_at?: Date;
	dm_spam_detected_at?: Date;
	invites_disabled_until?: Date;
	dms_disabled_until?: Date;
};

export interface GuildPremiumFeatures {
	features: GuildFeature[];
	additional_emoji_slots: number;
	additional_sticker_slots: number;
	additional_sound_slots: number;
};

export interface GuildIdentity {
	tag: string;
	badge: CDNElement;
};

export class Guild<Partial extends boolean = false> {
	id: Snowflake;
	name: string;
	icon?: CDNElement;
	home_header?: CDNElement;
	splash?: CDNElement;
	discovery_splash?: CDNElement;
	description?: string;
	features: GuildFeature[];
	emojis: EmojiCollection;
	stickers: StickerCollection;
	approximate_member_count?: number;
	approximate_presence_count?: number;

	banner?: PartialType<CDNElement, Partial>;
	owner_id!: PartialType<Snowflake, Partial>;
	afk_channel_id?: PartialType<Snowflake, Partial>;
	afk_timeout!: PartialType<number, Partial>;
	widget_enabled?: PartialType<boolean, Partial>;
	widget_channel_id?: PartialType<Snowflake, Partial>;
	verification_level!: PartialType<GuildVerificationLevel, Partial>;
	default_message_notifications!: PartialType<GuildMessageNotificationLevel, Partial>;
	explicit_content_filter!: PartialType<GuildExplicitContentFilterLevel, Partial>;
	roles!: PartialType<RoleCollection, Partial>;
	mfa_level!: PartialType<GuildMfaLevel, Partial>;
	system_channel_id?: PartialType<Snowflake, Partial>;
	system_channel_flags!: PartialType<GuildSystemChannelFlags, Partial>;
	rules_channel_id?: PartialType<Snowflake, Partial>;
	public_updates_channel_id?: PartialType<Snowflake, Partial>;
	safety_alerts_channel_id?: PartialType<Snowflake, Partial>;
	max_presences?: PartialType<number, Partial>;
	max_members?: PartialType<number, Partial>;
	vanity_url_code?: PartialType<string, Partial>;
	premium_tier!: PartialType<GuildPremiumTier, Partial>;
	premium_subscription_count!: PartialType<number, Partial>;
	preferred_locale!: PartialType<string, Partial>;
	max_video_channel_users?: PartialType<number, Partial>;
	max_stage_video_channel_users?: PartialType<number, Partial>;
	nsfw_level!: PartialType<GuildNsfwLevel, Partial>;
	owner_configured_content_level?: PartialType<GuildNsfwLevel, Partial>;
	hub_type?: PartialType<GuildHubType, Partial>;
	premium_progress_bar_enabled!: PartialType<boolean, Partial>;
	premium_progress_bar_enabled_user_updated_at?: PartialType<Date, Partial>;
	latest_onboarding_question_id?: PartialType<Snowflake, Partial>;
	incidents_data?: PartialType<GuildAutomodIncidentsData, Partial>;
	premium_features?: PartialType<GuildPremiumFeatures, Partial>;
	profile?: PartialType<GuildIdentity, Partial>;
	official_message_color?: PartialType<Color, Partial>;
	version?: PartialType<string, Partial>;

	channels = new ChannelCollection();

	get settings(): GuildSettings | undefined {
		return discordClient.settings?.guilds?.guilds[this.id];
	};

	constructor(data: any) {
		const Partial = data.owner_id === undefined;

		this.id = data.id;
		this.name = data.name;
		if (data.icon) this.icon = new CDNElement(`/icons/${data.id}`, data.icon);
		if (data.home_header) this.home_header = new CDNElement(`/home-headers/${data.id}`, data.home_header);
		if (data.splash) this.splash = new CDNElement(`/splashes/${data.id}`, data.splash);
		if (data.discovery_splash) this.discovery_splash = new CDNElement(`/discovery-splashes/${data.id}`, data.discovery_splash);
		this.description = data.description;
		this.features = data.features ?? [];
		this.emojis = new EmojiCollection(data.emojis ?? {});
		this.stickers = new StickerCollection(data.stickers ?? {});
		this.approximate_member_count = data.approximate_member_count;
		this.approximate_presence_count = data.approximate_presence_count;

		if (!Partial) {
			if (data.banner) this.banner = new CDNElement(`/banners/${data.id}`, data.banner);
			this.owner_id = data.owner_id;
			this.afk_channel_id = data.afk_channel_id;
			this.afk_timeout = data.afk_timeout;
			this.widget_enabled = data.widget_enabled;
			this.widget_channel_id = data.widget_channel_id;
			this.verification_level = data.verification_level;
			this.default_message_notifications = data.default_message_notifications;
			this.explicit_content_filter = data.explicit_content_filter;
			this.roles = new RoleCollection(data.roles ?? []);
			this.mfa_level = data.mfa_level;
			this.system_channel_id = data.system_channel_id;
			this.system_channel_flags = data.system_channel_flags;
			this.rules_channel_id = data.rules_channel_id;
			this.public_updates_channel_id = data.public_updates_channel_id;
			this.safety_alerts_channel_id = data.safety_alerts_channel_id;
			this.max_presences = data.max_presences;
			this.max_members = data.max_members;
			this.vanity_url_code = data.vanity_url_code;
			this.premium_tier = data.premium_tier;
			this.premium_subscription_count = data.premium_subscription_count;
			this.preferred_locale = data.preferred_locale;
			this.max_video_channel_users = data.max_video_channel_users;
			this.max_stage_video_channel_users = data.max_stage_video_channel_users;
			this.nsfw_level = data.nsfw_level;
			this.owner_configured_content_level = data.owner_configured_content_level;
			this.hub_type = data.hub_type;
			this.premium_progress_bar_enabled = data.premium_progress_bar_enabled;
			if (data.premium_progress_bar_enabled_user_updated_at) this.premium_progress_bar_enabled_user_updated_at = new Date(data.premium_progress_bar_enabled_user_updated_at);
			this.latest_onboarding_question_id = data.latest_onboarding_question_id;
			if (data.incidents_data) this.incidents_data = {
				raid_detected_at: data.incidents_data.raid_detected_at ? new Date(data.incidents_data.raid_detected_at) : undefined,
				dm_spam_detected_at: data.incidents_data.dm_spam_detected_at ? new Date(data.incidents_data.dm_spam_detected_at) : undefined,
				invites_disabled_until: data.incidents_data.invites_disabled_until ? new Date(data.incidents_data.invites_disabled_until) : undefined,
				dms_disabled_until: data.incidents_data.dms_disabled_until ? new Date(data.incidents_data.dms_disabled_until) : undefined
			};
			if (data.premium_features) this.premium_features = {
				features: data.premium_features.features,
				additional_emoji_slots: data.premium_features.additional_emoji_slots,
				additional_sticker_slots: data.premium_features.additional_sticker_slots,
				additional_sound_slots: data.premium_features.additional_sound_slots
			};
			if (data.profile) this.profile = {
				tag: data.profile.tag,
				badge: new CDNElement(`/guild-tag-badges/${data.id}`, data.profile.badge)
			};
			if (data.official_message_color !== undefined && data.official_message_color !== null) this.official_message_color = new Color(data.official_message_color);
			this.version = data.version;
		}

		this.channels = new ChannelCollection(data.channels ?? []);
	};

	async listChannels(force = false): Promise<Channel[]> {
		if (!force && this.channels.cached().size > 0) {
			return Array.from(this.channels.cached().values()).sort((a, b) => {
				if (a.category === b.category) {
					return (a.position ?? 0) - (b.position ?? 0);
				} else return a.category - b.category;
			});
		}

		const response = await discordClient.rest.request(`/guilds/${this.id}/channels`);
		const channels = await response.json();
		const list = [];

		for (const data of channels) {
			const channel = new Channel(data);
			this.channels.set(channel.id, channel);
			list.push(channel);
		}

		return list.sort((a, b) => {
			if (a.category === b.category) {
				return (a.position ?? 0) - (b.position ?? 0);
			} else return a.category - b.category;
		});
	};
};

export class GuildCollection extends Collection<Guild | Guild<true>> {
	async fetch<Partial extends boolean = false>(id: Snowflake, partial: Partial = false as Partial): Promise<Guild<Partial>> {
		const response = await discordClient.rest.request(`/guilds/${id}${partial ? "/basic" : ""}`);
		const guild = new Guild<Partial>(await response.json());
		discordClient.guilds.patch(id, guild);
		return guild;
	};
};