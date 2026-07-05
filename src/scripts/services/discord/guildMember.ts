import { CDNElement } from "/scripts/services/discord/cdn.ts";
import { Permission } from "/scripts/services/discord/permission.ts";
import { Role } from "/scripts/services/discord/role.ts";
import { UserDisplayNameStyle, User, UserAvatarDecorationData, UserCollectibles } from "/scripts/services/discord/user.ts";

import { discordClient } from "/main.ts";

const GuildMemberFlags = {
	DidRejoin: 1n << 0n,
	CompletedOnboarding: 1n << 1n,
	BypassesVerification: 1n << 2n,
	StartedOnboarding: 1n << 3n,
	IsGuest: 1n << 4n,
	StartedHomeActions: 1n << 5n,
	CompletedHomeActions: 1n << 6n,
	AutomodQuarantinedName: 1n << 7n,
	DMSettingsUpsellAcknowledged: 1n << 9n,
	AutomodQuarantinedGuildTag: 1n << 10n
} as const;
export type GuildMemberFlags = typeof GuildMemberFlags[keyof typeof GuildMemberFlags];

export class GuildMember {
	user: User<true>;
	nick?: string;
	avatar?: CDNElement;
	avatar_decoration_data?: UserAvatarDecorationData;
	collectibles?: UserCollectibles;
	display_name_styles?: UserDisplayNameStyle;
	banner?: CDNElement;
	bio?: string;
	roles: Role[];
	joined_at: Date;
	premium_since?: Date;
	deaf?: boolean;
	mute?: boolean;
	pending?: boolean;
	communication_disabled_until?: Date;
	unusual_dm_activity_until?: Date;
	flags: GuildMemberFlags;
	permissions?: Permission;

	constructor(data: any) {
		this.user = new User<true>(data.user);
		discordClient.users.patch(this.user.id, this.user);
		this.nick = data.nick;
		if (data.avatar) this.avatar = new CDNElement("/avatars", data.avatar);
		if (data.avatar_decoration_data) this.avatar_decoration_data = data.avatar_decoration_data;
		if (data.collectibles) this.collectibles = data.collectibles;
		if (data.display_name_styles) this.display_name_styles = data.display_name_styles;
		if (data.banner) this.banner = new CDNElement("/banners", data.banner);
		this.bio = data.bio;
		this.roles = data.roles.map((role: any) => new Role(role));
		this.joined_at = new Date(data.joined_at);
		if (data.premium_since) this.premium_since = new Date(data.premium_since);
		this.deaf = data.deaf;
		this.mute = data.mute;
		this.pending = data.pending;
		if (data.communication_disabled_until) this.communication_disabled_until = new Date(data.communication_disabled_until);
		if (data.unusual_dm_activity_until) this.unusual_dm_activity_until = new Date(data.unusual_dm_activity_until);
		this.flags = data.flags;
		this.permissions = new Permission(data.permissions);
	};
};