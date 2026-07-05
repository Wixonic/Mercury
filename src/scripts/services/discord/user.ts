import { Collection, Color, PartialType } from "/scripts/lib/utils.ts";

import { CDNElement } from "/scripts/services/discord/cdn.ts";
import { Snowflake } from "/scripts/services/discord/snowflake.ts";

import { discordClient } from "/main.ts";

export interface UserAvatarDecorationData {
	asset: CDNElement;
	sku_id: Snowflake;
	expires_at: number | null;
};

export enum UserNameplateColorPalette {
	None = "none",
	Crimson = "crimson",
	Berry = "berry",
	Sky = "sky",
	Teal = "teal",
	Forest = "forest",
	BubbleGum = "bubble_gum",
	Violet = "violet",
	Cobalt = "cobalt",
	Clover = "clover",
	Lemon = "lemon",
	White = "white"
};

export interface UserNameplateData {
	asset: string;
	sku_id: Snowflake;
	label: string;
	palette: UserNameplateColorPalette;
	expires_at: number | null;
};

export interface UserCollectibles {
	nameplate: UserNameplateData | null;
};

export enum UserDisplayNameStyle {
	Default = 11,
	Bangers = 1,
	BioRhyme = 2,
	CherryBomb = 3,
	Chicle = 4,
	Compagnon = 5,
	MuseoModerno = 6,
	NeoCastel = 7,
	PixelifySans = 8,
	Ribes = 9,
	Sinistre = 10,
	ZillaSlab = 12
};

export enum UserDisplayNameEffect {
	Solid = 1,
	Gradient = 2,
	Neon = 3,
	Toon = 4,
	Pop = 5,
	Glow = 6
};

export interface DisplayNameStyle {
	font_id: UserDisplayNameStyle;
	effect_id: UserDisplayNameEffect;
	colors: Color[];
};

export interface UserPrimaryGuild {
	identity_enabled: boolean | null;
	identity_guild_id: Snowflake | null;
	tag: string | null;
	badge: CDNElement | null;
};

const PublicUserFlags = {
	Staff: 1n << 0n,
	Partner: 1n << 1n,
	HypeSquad: 1n << 2n,
	BugHunterLevel1: 1n << 3n,
	HypeSquadBravery: 1n << 6n,
	HypeSquadBrilliance: 1n << 7n,
	HypeSquadBalance: 1n << 8n,
	PremiumEarlySupporter: 1n << 9n,
	TeamPseudoUser: 1n << 10n,
	DiscordBugHunterLevel2: 1n << 14n,
	VerifiedBot: 1n << 16n,
	EarlyVerifiedDeveloper: 1n << 17n,
	CertifiedModeratorAlumni: 1n << 18n,
	BotHTTPInteractions: 1n << 19n,
	Spammer: 1n << 20n,
	ProvisionalAccount: 1n << 23n
} as const;
export type PublicUserFlags = typeof PublicUserFlags[keyof typeof PublicUserFlags];

const UserFlags = {
	...PublicUserFlags,
	MFASMS: 1n << 4n,
	IsHubSpotContact: 1n << 11n,
	HasUnreadUrgentMessages: 1n << 13n,
	UnderageDeleted: 1n << 15n,
	ProvisionalAccount: 1n << 23n,
	HighGlobalRateLimit: 1n << 33n,
	Deleted: 1n << 34n,
	DisabledSuspiciousActivity: 1n << 35n,
	SelfDeleted: 1n << 36n,
	PremiumDiscriminator: 1n << 37n,
	UsedDesktopClient: 1n << 38n,
	UsedWebClient: 1n << 39n,
	UsedMobileClient: 1n << 40n,
	Disabled: 1n << 41n,
	HasSessionStarted: 1n << 43n,
	Quarantined: 1n << 44n,
	PremiumEligibleForUniqueUsername: 1n << 47n,
	Collaborator: 1n << 50n,
	RestrictedCollaborator: 1n << 51n
} as const;
export type UserFlags = typeof UserFlags[keyof typeof UserFlags];

export enum UserLinkStatus {
	Requested = 1,
	Connected = 2,
	Disconnected = 3,
	Rejected = 4
};

export enum UserLinkType {
	User = 1,
	Requestor = 2
};

export interface UserLinkedUser {
	created_at: Date;
	updated_at: Date;
	link_status: UserLinkStatus;
	link_type: UserLinkType;
	requestor_id: Snowflake;
	user_id: Snowflake;
};

export enum UserAgeVerificationStatus {
	Unverified = 1,
	VerifiedTeen = 2,
	VerifiedAdult = 3,
	InferredAdult = 4
};

export enum UserPremiumType {
	None = 0,
	NitroClassic = 1,
	Nitro = 2,
	NitroBasic = 3
};

export enum UserPremiumSource {
	Subscription = 1,
	FractionalPremium = 2,
	ReverseTrial = 3,
	SubscriptionGroup = 4
};

export enum UserPremiumSubscriptionType {
	BoostOnly = 1,
	NitroBasic = 2,
	NitroClassic = 3,
	Nitro = 4
};

export enum UserPremiumSubscriptionGroupRole {
	Primary = 1,
	Member = 2
};

export interface UserPremiumState {
	premium_source: UserPremiumSource;
	premium_subscription_type: UserPremiumSubscriptionType;
	premium_subscription_group_role?: UserPremiumSubscriptionGroupRole;
};

const UserPurchasedFlags = {
	NitroClassic: 1n << 0n,
	Nitro: 1n << 1n,
	GuildBoost: 1n << 2n,
	NitroBasic: 1n << 3n,
	ReverseTrial: 1n << 4n
} as const;
export type UserPurchasedFlags = typeof UserPurchasedFlags[keyof typeof UserPurchasedFlags];

/**
 * Premium usage flags denote what premium (Nitro) features a user has utilized.
 */
const UserPremiumUsageFlags = {
	PremiumDiscriminator: 1n << 0n,
	AnimatedAvatar: 1n << 1n,
	ProfileBanner: 1n << 2n
} as const;
export type UserPremiumUsageFlags = typeof UserPremiumUsageFlags[keyof typeof UserPremiumUsageFlags];

export enum UserAuthenticatorType {
	WebAuthn = 1,
	TimeBasedOneTimePassword = 2,
	SMS = 3
};

export interface UserCustomStatus {
	text: string | null;
	emoji_id: Snowflake | null;
	emoji_name: string | null;
	expires_at: Date | null;
};

export enum UserStatusType {
	online,
	idle,
	dnd,
	invisible,
	offline,
	unknown
};

export class User<Partial extends boolean = false> {
	id!: Snowflake;
	username!: string;
	discriminator!: string;
	global_name?: string;
	avatar!: CDNElement;
	avatar_decoration_data?: UserAvatarDecorationData;
	collectibles?: UserCollectibles;
	display_name_styles?: DisplayNameStyle;
	primary_guild?: UserPrimaryGuild;
	bot?: boolean;
	system?: boolean;
	banner?: CDNElement;
	accent_color?: Color;
	public_flags?: PublicUserFlags;

	linked_users!: PartialType<UserLinkedUser[], Partial>;
	mfa_enabled!: PartialType<boolean, Partial>;
	nsfw_allowed?: PartialType<boolean, Partial>;
	age_verification_status!: PartialType<UserAgeVerificationStatus, Partial>;
	pronouns?: PartialType<string, Partial>;
	bio!: PartialType<string, Partial>;
	locale?: PartialType<string, Partial>;
	verified!: PartialType<boolean, Partial>;
	email!: PartialType<string, Partial>;
	phone?: PartialType<string, Partial>;
	premium_type!: PartialType<UserPremiumType, Partial>;
	premium_state?: PartialType<UserPremiumState, Partial>;
	personal_connection_id?: PartialType<Snowflake, Partial>;
	flags!: PartialType<UserFlags, Partial>;
	purchased_flags?: PartialType<UserPurchasedFlags, Partial>;
	premium_usage_flags?: PartialType<UserPremiumUsageFlags, Partial>;
	desktop?: PartialType<boolean, Partial>;
	mobile?: PartialType<boolean, Partial>;
	has_bounced_email?: PartialType<boolean, Partial>;
	authenticator_types?: PartialType<UserAuthenticatorType[], Partial>;
	analytics_token!: PartialType<string, Partial>;

	constructor(data: any) {
		Object.assign(this, data);

		this.avatar = data.avatar ? new CDNElement(`/avatars/${data.id}`, data.avatar) : new CDNElement("/embed/avatars", this.user_index.toString());
		if (data.avatar_decoration_data) this.avatar_decoration_data = {
			...data.avatar_decoration_data,
			asset: new CDNElement("/avatar-decoration-presets", data.avatar_decoration_data.asset)
		};
		if (data.collectibles) this.collectibles = {
			...data.collectibles,
			nameplate: data.collectibles.nameplate ? {
				...data.collectibles.nameplate,
				asset: new CDNElement(`/assets/collectibles/`, data.collectibles.nameplate.asset)
			} : null
		};
		if (data.banner) this.banner = new CDNElement(`/banners/${data.id}`, data.banner);
		if (data.accent_color !== undefined && data.accent_color !== null) this.accent_color = new Color(data.accent_color);
		if (data.display_name_styles) this.display_name_styles = {
			...data.display_name_styles,
			colors: (data.display_name_styles.colors ?? []).map((color: number) => new Color(color))
		};
		if (data.primary_guild) this.primary_guild = {
			...data.primary_guild,
			badge: data.primary_guild.badge ? new CDNElement(`/guild-tag-badges/${data.primary_guild.identity_guild_id}`, data.primary_guild.badge) : null
		};
	};

	get user_index(): number {
		return this.discriminator === "0" ? (parseInt(this.id) >> 22) % 6 : parseInt(this.discriminator) % 5;
	};

	get display_name(): string {
		return this.global_name || this.username;
	};
};

export class UserCollection extends Collection<User | User<true>> {
	async fetch<Partial extends boolean = false>(id: Snowflake, partial: Partial = false as Partial): Promise<User<Partial>> {
		const response = await discordClient.rest.request(`/users/${id}${partial ? "/basic" : ""}`);
		return new User<Partial>(await response.json());
	};
};