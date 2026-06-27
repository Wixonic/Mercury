import { Color, Collection, Loaded } from "/scripts/lib/utils.ts";

import { CDNElement } from "/scripts/services/discord/cdn.ts";
import { Emoji, EmojiCollection } from "/scripts/services/discord/emoji.ts";
import { Role, RoleCollection } from "/scripts/services/discord/role.ts";
import { Sticker, StickerCollection } from "/scripts/services/discord/sticker.ts";
import type { Snowflake } from "/scripts/services/discord/snowflake.ts";

import { discordClient } from "/main.ts";

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
	ACTIVITIES_ALPHA,
	ACTIVITIES_EMPLOYEE,
	ACTIVITIES_INTERNAL_DEV,
	ACTIVITY_FEED_DISABLED_BY_USER,
	ACTIVITY_FEED_ENABLED_BY_USER,
	AGE_VERIFICATION_LARGE_GUILD,
	ANIMATED_BANNER,
	ANIMATED_ICON,
	AUDIO_BITRATE_128_KBPS,
	AUDIO_BITRATE_256_KBPS,
	AUDIO_BITRATE_384_KBPS,
	AUTO_MODERATION,
	BANNER,
	BFG,
	BOT_DEVELOPER_EARLY_ACCESS,
	BYPASS_SLOWMODE_PERMISSION_MIGRATION_COMPLETE,
	CHANNEL_EMOJIS_GENERATED,
	CHANNEL_ICON_EMOJIS_GENERATED,
	COMMERCE,
	COMMUNITY,
	COMMUNITY_CANARY,
	COMMUNITY_EXP_LARGE_GATED,
	COMMUNITY_EXP_LARGE_UNGATED,
	COMMUNITY_EXP_MEDIUM,
	CONFERENCE,
	CONSIDERED_EXTERNALLY_DISCOVERABLE,
	CREATOR_MONETIZABLE,
	CREATOR_MONETIZABLE_DISABLED,
	CREATOR_MONETIZABLE_PENDING_NEW_OWNER_ONBOARDING,
	CREATOR_MONETIZABLE_PROVISIONAL,
	CREATOR_MONETIZABLE_RESTRICTED,
	CREATOR_MONETIZABLE_WHITEGLOVE,
	CREATOR_MONETIZATION_APPLICATION_ALLOWLIST,
	CREATOR_STORE_PAGE,
	DEVELOPER_SUPPORT_SERVER,
	DISCOVERABLE,
	DISCOVERABLE_DISABLED,
	ENABLED_DISCOVERABLE_BEFORE,
	ENABLED_MODERATION_EXPERIENCE_FOR_NON_COMMUNITY,
	ENHANCED_ROLE_COLORS,
	EXPOSED_TO_ACTIVITIES_WTP_EXPERIMENT,
	FORWARDING_DISABLED,
	GAME_SERVER_HOSTING,
	GAME_SERVERS,
	GUESTS_ENABLED,
	GUILD_ONBOARDING,
	GUILD_ONBOARDING_EVER_ENABLED,
	GUILD_ONBOARDING_HAS_PROMPTS,
	GUILD_PRODUCTS,
	GUILD_PRODUCTS_ALLOW_ARCHIVED_FILE,
	GUILD_SERVER_GUIDE,
	GUILD_TAGS,
	GUILD_TAGS_BADGE_PACK_CREEPY_CRAWLIES,
	GUILD_TAGS_BADGE_PACK_FLEX,
	GUILD_TAGS_BADGE_PACK_PETS,
	GUILD_TAGS_BADGE_PACK_PLANT,
	GUILD_WEB_PAGE_VANITY_URL,
	HAD_EARLY_ACTIVITIES_ACCESS,
	HAS_DIRECTORY_ENTRY,
	HIDE_FROM_EXPERIMENT_UI,
	HUB,
	INCREASED_THREAD_LIMIT,
	INTERNAL_EMPLOYEE_ONLY,
	INVITE_SPLASH,
	INVITES_DISABLED,
	LINKED_TO_HUB,
	MAX_FILE_SIZE_50_MB,
	MAX_FILE_SIZE_100_MB,
	MAX_FILE_SIZE_250_MB,
	MEMBER_VERIFICATION_GATE_ENABLED,
	MEMBER_VERIFICATION_MANUAL_APPROVAL,
	MORE_EMOJI,
	MORE_SOUNDBOARD,
	MORE_STICKERS,
	NEWS,
	NON_COMMUNITY_RAID_ALERTS,
	OFFICIAL_GAME_GUILD,
	PARTNERED,
	PIN_PERMISSION_MIGRATION_COMPLETE,
	POWERUP_BETA_FEATURES,
	PREMIUM_TIER_3_OVERRIDE,
	PREVIEW_ENABLED,
	PRODUCTS_AVAILABLE_FOR_PURCHASE,
	RAID_ALERTS_DISABLED,
	RELAY_ENABLED,
	REPORT_TO_MOD_PILOT,
	REPORT_TO_MOD_SURVEY,
	ROLE_ICONS,
	ROLE_SUBSCRIPTIONS_AVAILABLE_FOR_PURCHASE,
	ROLE_SUBSCRIPTIONS_ENABLED,
	SHARED_CANVAS_FRIENDS_AND_FAMILY_TEST,
	SOCIAL_LAYER_STOREFRONT,
	SOUNDBOARD,
	STAGE_CHANNEL_VIEWERS_50,
	STAGE_CHANNEL_VIEWERS_150,
	STAGE_CHANNEL_VIEWERS_300,
	SUMMARIES_ENABLED_GA,
	SUMMARIES_DISABLED_BY_USER,
	SUMMARIES_ENABLED_BY_USER,
	SUMMARIES_LONG_LOOKBACK,
	SUMMARIES_OPT_OUT_EXPERIENCE,
	STAFF_LEVEL_COLLABORATOR_REQUIRED,
	STAFF_LEVEL_RESTRICTED_COLLABORATOR_REQUIRED,
	TIERLESS_BOOSTING,
	TIERLESS_BOOSTING_SYSTEM_MESSAGE,
	VANITY_URL,
	VERIFIED,
	VIDEO_BITRATE_ENHANCED,
	VIDEO_QUALITY_720_60FPS,
	VIDEO_QUALITY_1080_60FPS,
	VIP_REGIONS,
	VOICE_IN_THREADS,
	WELCOME_SCREEN_ENABLED,
};

export enum GuildMfaLevel {
	None = 0,
	Elevated = 1
};

export const GuildSystemChannelFlags = {
	SUPPRESS_JOIN_NOTIFICATIONS: 1n << 0n,
	SUPPRESS_PREMIUM_SUBSCRIPTIONS: 1n << 1n,
	SUPPRESS_GUILD_REMINDER_NOTIFICATIONS: 1n << 2n,
	SUPPRESS_JOIN_NOTIFICATION_REPLIES: 1n << 3n,
	SUPPRESS_ROLE_SUBSCRIPTION_PURCHASE_NOTIFICATIONS: 1n << 4n,
	SUPPRESS_ROLE_SUBSCRIPTION_PURCHASE_NOTIFICATION_REPLIES: 1n << 5n,
	SUPPRESS_CHANNEL_PROMPT_DEADCHAT: 1n << 7n,
	SUPPRESS_UGC_ADDED_NOTIFICATIONS: 1n << 8n
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
	raid_detected_at: Date | null;
	dm_spam_detected_at: Date | null;
	invites_disabled_until: Date | null;
	dms_disabled_until: Date | null;
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



export class Guild<Ready extends boolean = true> {
	id!: Snowflake;
	name!: string;
	icon!: CDNElement | null;
	home_header!: CDNElement | null;
	splash!: CDNElement | null;
	discovery_splash!: CDNElement | null;
	description!: string | null;
	features!: GuildFeature[];
	emojis!: EmojiCollection;
	stickers!: StickerCollection;
	approximate_member_count!: number | null;
	approximate_presence_count!: number | null;

	banner!: Loaded<CDNElement | null, Ready>;
	owner_id!: Loaded<Snowflake, Ready>;
	afk_channel_id!: Loaded<Snowflake | null, Ready>;
	afk_timeout!: Loaded<number, Ready>;
	widget_enabled!: Loaded<boolean | null, Ready>;
	widget_channel_id!: Loaded<Snowflake | null, Ready>;
	verification_level!: Loaded<GuildVerificationLevel, Ready>;
	default_message_notifications!: Loaded<GuildMessageNotificationLevel, Ready>;
	explicit_content_filter!: Loaded<GuildExplicitContentFilterLevel, Ready>;
	roles!: Loaded<RoleCollection, Ready>;
	mfa_level!: Loaded<GuildMfaLevel, Ready>;
	system_channel_id!: Loaded<Snowflake | null, Ready>;
	system_channel_flags!: Loaded<GuildSystemChannelFlags, Ready>;
	rules_channel_id!: Loaded<Snowflake | null, Ready>;
	public_updates_channel_id!: Loaded<Snowflake | null, Ready>;
	safety_alerts_channel_id!: Loaded<Snowflake | null, Ready>;
	max_presences!: Loaded<number | null, Ready>;
	max_members!: Loaded<number | null, Ready>;
	vanity_url_code!: Loaded<string | null, Ready>;
	premium_tier!: Loaded<GuildPremiumTier, Ready>;
	premium_subscription_count!: Loaded<number, Ready>;
	preferred_locale!: Loaded<string, Ready>;
	max_video_channel_users!: Loaded<number | null, Ready>;
	max_stage_video_channel_users!: Loaded<number | null, Ready>;
	nsfw_level!: Loaded<GuildNsfwLevel, Ready>;
	owner_configured_content_level!: Loaded<GuildNsfwLevel | null, Ready>;
	hub_type!: Loaded<GuildHubType | null, Ready>;
	premium_progress_bar_enabled!: Loaded<boolean, Ready>;
	premium_progress_bar_enabled_user_updated_at!: Loaded<Date | null, Ready>;
	latest_onboarding_question_id!: Loaded<Snowflake | null, Ready>;
	incidents_data!: Loaded<GuildAutomodIncidentsData | null, Ready>;
	premium_features!: Loaded<GuildPremiumFeatures | null, Ready>;
	profile!: Loaded<GuildIdentity | null, Ready>;
	official_message_color!: Loaded<Color | null, Ready>;
	version!: Loaded<string | null, Ready>;

	constructor(data: any) {
		Object.assign(this, data);

		this.icon = data.icon ? new CDNElement(`/icons/${data.id}`, data.icon) : null;
		this.home_header = data.home_header ? new CDNElement(`/home-headers/${data.id}`, data.home_header) : null;
		this.splash = data.splash ? new CDNElement(`/splashes/${data.id}`, data.splash) : null;
		this.discovery_splash = data.discovery_splash ? new CDNElement(`/discovery-splashes/${data.id}`, data.discovery_splash) : null;
		this.features = data.features ?? [];
		this.emojis = new EmojiCollection(data.emojis ?? {});
		this.stickers = new StickerCollection(data.stickers ?? {});

		if (data.owner_id !== undefined) {
			this.banner = data.banner ? new CDNElement(`/banners/${data.id}`, data.banner) : null;
			this.roles = new RoleCollection(data.roles);
		}
	};
};

export class GuildCollection extends Collection<Guild | Guild<false>> {
	async fetch<Partial extends boolean = false>(id: string, partial: Partial = false as Partial): Promise<Guild<Partial extends true ? false : true>> {
		const response = await discordClient.rest.request(`/guilds/${id}${partial ? "/basic" : ""}`);
		return new Guild<Partial extends true ? false : true>(await response.json());
	};
};