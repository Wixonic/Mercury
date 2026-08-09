import { getIcon } from "/scripts/lib/icon.ts";
import { Collection, PartialType } from "/scripts/lib/utils.ts";

import { CDNElement } from "/scripts/services/discord/cdn.ts";
import { Emoji } from "/scripts/services/discord/emoji.ts";
import { GatewayDispatchEvent, GatewayOpCode } from "/scripts/services/discord/gateway.ts";
import { GuildMember } from "/scripts/services/discord/guildMember.ts";
import { Message } from "/scripts/services/discord/message.ts";
import { Role } from "/scripts/services/discord/role.ts";
import { ChannelSettings } from "/scripts/services/discord/settings.ts";
import type { Snowflake } from "/scripts/services/discord/snowflake.ts";
import { User } from "/scripts/services/discord/user.ts";

import { discordClient } from "/main.ts";

export enum ChannelType {
	GuildText = 0,
	DM = 1,
	GuildVoice = 2,
	GroupDM = 3,
	GuildCategory = 4,
	GuildNews = 5,
	GuildStore = 6,
	NewsThread = 10,
	PublicThread = 11,
	PrivateThread = 12,
	GuildStageVoice = 13,
	GuildDirectory = 14,
	GuildForum = 15,
	GuildMedia = 16,
	Lobby = 17,
	EphemeralDM = 18
};

export enum ChannelCategory {
	Text = 0,
	Voice = 1,
	DM = 2
};

export enum ChannelPermissionOverwriteType {
	Role = 0,
	Member = 1
};

export interface ChannelPermissionOverwrite {
	id: Snowflake;
	type: ChannelPermissionOverwriteType;
	allow: string;
	deny: string;
};

const ChannelRecipientFlags = {
	DismissedInGameMessageNux: 1n << 0n,
} as const;
export type ChannelRecipientFlags = typeof ChannelRecipientFlags[keyof typeof ChannelRecipientFlags];

export interface ChannelNick {
	id: Snowflake;
	nick: string;
};

export enum ChannelSafetyWarningType {
	StrangerDanger = 1,
	InappropriateConversationTier1 = 2,
	InappropriateConversationTier2 = 3,
	LikelyATO = 4
};

export interface ChannelSafetyWarning {
	id: string;
	type: ChannelSafetyWarningType;
	expiry: Date;
	dismiss_timestamp: Date | null;
};

export interface ChannelVoiceRegion {
	id: string;
	name: string;
	optimal: boolean;
	deprecated: boolean;
	custom: boolean;
};

export enum ChannelVideoQualityMode {
	Auto = 1,
	Full = 2
};

export interface ThreadMetadata {
	archived: boolean;
	auto_archive_duration: number;
	archive_timestamp: Date;
	locked: boolean;
	invitable?: boolean;
	create_timestamp?: Date | null;
};

const ThreadMemberFlags = {
	HasInteracted: 1n << 0n,
	AllMessages: 1n << 1n,
	OnlyMentions: 1n << 2n,
	NoMessages: 1n << 3n
} as const;
export type ThreadMemberFlags = typeof ThreadMemberFlags[keyof typeof ThreadMemberFlags];

export interface MuteConfig {
	end_time?: Date;
	selected_time_window?: number;
};

export interface ThreadMember {
	id?: Snowflake;
	user_id?: Snowflake;
	join_timestamp: Date;
	flags: ThreadMemberFlags;
	muted?: boolean;
	mute_config?: MuteConfig;
	member?: GuildMember;
};

const ChannelFlags = {
	GuildFeedRemoved: 1n << 0n,
	Pinned: 1n << 1n,
	ActiveChannelsRemoved: 1n << 2n,
	RequireTag: 1n << 4n,
	IsSpam: 1n << 5n,
	IsGuildResourceChannel: 1n << 7n,
	ClydeAI: 1n << 8n,
	IsScheduledForDeletion: 1n << 9n,
	SummariesDisabled: 1n << 11n,
	IsRoleSubscriptionTemplatePreviewChannel: 1n << 13n,
	IsBroadcasting: 1n << 14n,
	HideMediaDownloadOptions: 1n << 15n,
	IsJoinRequestInterviewChannel: 1n << 16n,
	Obfuscated: 1n << 17n,
	IsModeratorReportChannel: 1n << 19n,
	IsSpoilerChannel: 1n << 21n
} as const;
export type ChannelFlags = typeof ChannelFlags[keyof typeof ChannelFlags];

export interface ForumTag {
	id: Snowflake;
	name: string;
	moderated: boolean;
	emoji_id?: Snowflake;
	emoji_name?: string;
};

export enum ForumLayoutType {
	Default = 0,
	List = 1,
	Grid = 2
};

export enum ForumSortOrderType {
	LatestActivity = 0,
	CreationTime = 1
};

export enum ForumSearchTagSetting {
	MatchSome = "match_some",
	MatchAll = "match_all"
};

export interface LinkedLobby {
	application_id: Snowflake;
	lobby_id: Snowflake;
	linked_by: Snowflake;
	linked_at: Date;
	require_application_authorization: boolean;
};

export class Channel<Partial extends boolean = false> {
	id: Snowflake;
	type: ChannelType;
	name?: string;
	recipients?: Snowflake[];
	icon?: CDNElement;
	guildId?: Snowflake;

	position?: PartialType<number, Partial>;
	permission_overwritees?: PartialType<ChannelPermissionOverwrite[], Partial>;
	topic?: PartialType<string, Partial>;
	nsfw?: PartialType<boolean, Partial>;
	last_message_id?: PartialType<Snowflake, Partial>;
	last_pin_timestamp?: PartialType<Date, Partial>;
	bitrate?: PartialType<number, Partial>;
	user_limit?: PartialType<number, Partial>;
	rate_limit_per_user?: PartialType<number, Partial>;
	recipient_flags?: PartialType<ChannelRecipientFlags[], Partial>;
	nicks?: PartialType<ChannelNick[], Partial>;
	managed?: PartialType<boolean, Partial>;
	blocked_user_warning_dismissed?: PartialType<boolean, Partial>;
	safety_warnings?: PartialType<ChannelSafetyWarning[], Partial>;
	application_id?: PartialType<Snowflake, Partial>;
	owner_id?: PartialType<Snowflake, Partial>;
	owner?: PartialType<GuildMember, Partial>;
	parent_id?: PartialType<Snowflake, Partial>;
	rtc_region?: PartialType<ChannelVoiceRegion, Partial>;
	video_quality_mode?: PartialType<ChannelVideoQualityMode, Partial>;
	total_message_sent?: PartialType<number, Partial>;
	message_count?: PartialType<number, Partial>;
	member_count?: PartialType<number, Partial>;
	member_ids_preview?: PartialType<Snowflake[], Partial>;
	thread_metadata?: PartialType<ThreadMetadata, Partial>;
	thread_member?: PartialType<ThreadMember, Partial>;
	default_auto_archive_duration?: PartialType<number, Partial>;
	default_thread_rate_limit_per_user?: PartialType<number, Partial>;
	permissions?: PartialType<string, Partial>;
	flags?: PartialType<ChannelFlags, Partial>;
	available_tags?: PartialType<ForumTag[], Partial>;
	applied_tags?: PartialType<Snowflake[], Partial>;
	default_reaction_emoji?: PartialType<Emoji, Partial>;
	default_forum_layout?: PartialType<ForumLayoutType, Partial>;
	default_sort_order?: PartialType<ForumSortOrderType, Partial>;
	default_tag_setting?: PartialType<ForumSearchTagSetting, Partial>;
	is_message_request?: PartialType<boolean, Partial>;
	is_message_request_timestamp?: PartialType<Date, Partial>;
	is_spam?: PartialType<boolean, Partial>;
	status?: PartialType<string, Partial>;
	hd_streaming_until?: PartialType<Date, Partial>;
	hd_streaming_buyer_id?: PartialType<Snowflake, Partial>;
	linked_lobby?: PartialType<LinkedLobby, Partial>;
	is_linkable?: PartialType<boolean, Partial>;
	is_viewable_and_writeable_by_all_members?: PartialType<boolean, Partial>;
	template?: PartialType<string, Partial>;
	version?: PartialType<string, Partial>;

	get settings(): ChannelSettings | undefined {
		if (!this.guildId) return undefined;
		return discordClient.settings?.guilds?.guilds[this.guildId]?.channels[this.id];
	};

	constructor(data: any) {
		const Partial = data.position === undefined;

		this.id = data.id;
		this.type = data.type;
		this.name = data.name;
		if (data.recipients) this.recipients = data.recipients.map((recipient: User<false>) => {
			const user = new User<true>(recipient);
			discordClient.users.patch(user.id, user);
			return user.id;
		});
		if (data.icon) this.icon = new CDNElement(`/channels/${data.id}/icons`, data.icon);
		this.guildId = data.guildId ?? data.guild_id;

		if (!Partial) {
			this.position = data.position;
			if (data.permission_overwrites || data.permission_overwritees) this.permission_overwritees = data.permission_overwrites ?? data.permission_overwritees;
			this.topic = data.topic;
			this.nsfw = data.nsfw;
			this.last_message_id = data.last_message_id;
			if (data.last_pin_timestamp) this.last_pin_timestamp = new Date(data.last_pin_timestamp);
			this.bitrate = data.bitrate;
			this.user_limit = data.user_limit;
			this.rate_limit_per_user = data.rate_limit_per_user;
			this.recipient_flags = data.recipient_flags;
			if (data.nicks) this.nicks = data.nicks;
			this.managed = data.managed;
			this.blocked_user_warning_dismissed = data.blocked_user_warning_dismissed;
			if (data.safety_warnings) this.safety_warnings = data.safety_warnings.map((safety_warning: any) => ({
				id: safety_warning.id,
				type: safety_warning.type,
				expiry: new Date(safety_warning.expiry),
				dismiss_timestamp: safety_warning.dismiss_timestamp ? new Date(safety_warning.dismiss_timestamp) : null
			}));
			this.application_id = data.application_id;
			this.owner_id = data.owner_id;
			if (data.owner) this.owner = new GuildMember(data.owner);
			this.parent_id = data.parent_id;
			if (data.rtc_region) this.rtc_region = data.rtc_region;
			this.video_quality_mode = data.video_quality_mode;
			this.total_message_sent = data.total_message_sent;
			this.message_count = data.message_count;
			this.member_count = data.member_count;
			this.member_ids_preview = data.member_ids_preview;
			if (data.thread_metadata) this.thread_metadata = {
				archived: data.thread_metadata.archived,
				auto_archive_duration: data.thread_metadata.auto_archive_duration,
				archive_timestamp: new Date(data.thread_metadata.archive_timestamp),
				locked: data.thread_metadata.locked,
				invitable: data.thread_metadata.invitable,
				create_timestamp: data.thread_metadata.create_timestamp ? new Date(data.thread_metadata.create_timestamp) : null
			};
			if (data.member) this.thread_member = {
				id: data.member.id,
				user_id: data.member.user_id,
				join_timestamp: new Date(data.member.join_timestamp),
				flags: data.member.flags,
				muted: data.member.muted,
				mute_config: data.member.mute_config,
				member: data.member.member ? new GuildMember(data.member.member) : undefined
			};
			this.default_auto_archive_duration = data.default_auto_archive_duration;
			this.default_thread_rate_limit_per_user = data.default_thread_rate_limit_per_user;
			this.permissions = data.permissions;
			this.flags = data.flags;
			if (data.available_tags) this.available_tags = data.available_tags;
			this.applied_tags = data.applied_tags;
			if (data.default_reaction_emoji) this.default_reaction_emoji = new Emoji({
				id: data.default_reaction_emoji.emoji_id,
				name: data.default_reaction_emoji.emoji_name
			});
			this.default_forum_layout = data.default_forum_layout;
			this.default_sort_order = data.default_sort_order;
			this.default_tag_setting = data.default_tag_setting;
			this.is_message_request = data.is_message_request;
			if (data.is_message_request_timestamp) this.is_message_request_timestamp = new Date(data.is_message_request_timestamp);
			this.is_spam = data.is_spam;
			this.status = data.status;
			if (data.hd_streaming_until) this.hd_streaming_until = new Date(data.hd_streaming_until);
			this.hd_streaming_buyer_id = data.hd_streaming_buyer_id;
			if (data.linked_lobby) this.linked_lobby = {
				application_id: data.linked_lobby.application_id,
				lobby_id: data.linked_lobby.lobby_id,
				linked_by: data.linked_lobby.linked_by,
				linked_at: new Date(data.linked_lobby.linked_at),
				require_application_authorization: data.linked_lobby.require_application_authorization
			};
			this.is_linkable = data.is_linkable;
			this.is_viewable_and_writeable_by_all_members = data.is_viewable_and_writeable_by_all_members;
			this.template = data.template;
			this.version = data.version;
		}
	};

	get category(): ChannelCategory {
		const dmChannels = [
			ChannelType.DM,
			ChannelType.GroupDM,
			ChannelType.EphemeralDM
		];

		const voiceChannels = [
			ChannelType.GuildVoice,
			ChannelType.GuildStageVoice
		];

		if (dmChannels.includes(this.type)) return ChannelCategory.DM;
		else if (voiceChannels.includes(this.type)) return ChannelCategory.Voice;
		else return ChannelCategory.Text;
	};

	get displayName(): string {
		if (this.name) return this.name;
		else if (this.type === ChannelType.DM && this.recipients && this.recipients.length > 0) {
			const recipient = discordClient.users.cached().get(this.recipients[0]);
			return recipient?.display_name ?? recipient?.username ?? "Direct Message";
		} else if (this.type === ChannelType.GroupDM && this.recipients && this.recipients.length > 0) {
			const names = this.recipients.map((id) => {
				const recipient = discordClient.users.cached().get(id);
				return recipient?.display_name || recipient?.username;
			}).filter(Boolean);

			if (names.length > 0) return names.join(", ");
			return "Group DM";
		} else return this.name ?? "Unknown channel";
	};

	async getDisplayName(): Promise<string> {
		if (this.name) return this.name;
		else if (this.type === ChannelType.DM && this.recipients && this.recipients.length > 0) {
			const recipient = await discordClient.users.get(this.recipients[0]);
			return recipient?.display_name ?? recipient?.username ?? "Direct Message";
		} else if (this.type === ChannelType.GroupDM && this.recipients && this.recipients.length > 0) {
			const users = await Promise.all(this.recipients.map((id) => discordClient.users.get(id)));
			const names = users.filter((user): user is User => Boolean(user)).map((user) => user.display_name || user.username);

			if (names.length > 0) return names.join(", ");
			return "Group DM";
		} else return this.name ?? "Unknown channel";
	};

	get isPrivate(): boolean {
		if (this.is_viewable_and_writeable_by_all_members === false) return true;
		if (this.permission_overwritees && this.guildId) {
			const everyoneOverwrite = this.permission_overwritees.find((overwrite) => overwrite.id === this.guildId);
			if (everyoneOverwrite) return (BigInt(everyoneOverwrite.deny) & (1n << 10n)) !== 0n;
		}
		return false;
	};

	get isAccessible(): boolean {
		if (this.guildId) {
			const guild = discordClient.guilds.cached().get(this.guildId);
			if (guild?.owner_id === discordClient.id) return true;

			const memberRoles = guild?.currentMember?.roles ?? [];

			if (this.permission_overwritees) {
				const memberOverwrite = this.permission_overwritees.find((overwrite) => (overwrite.type === ChannelPermissionOverwriteType.Member || (overwrite.type as any) === 1) && overwrite.id === discordClient.id);
				if (memberOverwrite) {
					if ((BigInt(memberOverwrite.allow) & (1n << 10n)) !== 0n) return true;
					if ((BigInt(memberOverwrite.deny) & (1n << 10n)) !== 0n) return false;
				}

				for (const roleId of memberRoles) {
					const roleOverwrite = this.permission_overwritees.find((overwrite) => (overwrite.type === ChannelPermissionOverwriteType.Role || (overwrite.type as any) === 0) && overwrite.id === roleId);
					if (roleOverwrite && (BigInt(roleOverwrite.allow) & (1n << 10n)) !== 0n) return true;
				}

				for (const roleId of memberRoles) {
					const role = guild?.roles ? guild.roles.cached().get(roleId) : undefined;
					if (role?.permissions && (BigInt(role.permissions) & (1n << 3n)) !== 0n) return true;
				}

				const everyoneOverwrite = this.permission_overwritees.find((overwrite) => overwrite.id === this.guildId);
				if (everyoneOverwrite && (BigInt(everyoneOverwrite.deny) & (1n << 10n)) !== 0n) return false;
			}
		}

		if (this.permissions) {
			const perms = BigInt(this.permissions);
			if ((perms & (1n << 3n)) !== 0n) return true;
			if (this.category === ChannelCategory.Voice) return (perms & (1n << 20n)) !== 0n;
			return (perms & (1n << 10n)) !== 0n;
		}

		if (this.is_viewable_and_writeable_by_all_members === false) return false;

		return true;
	};

	get canSendMessages(): boolean {
		if (this.guildId) {
			const guild = discordClient.guilds.cached().get(this.guildId);
			if (guild?.owner_id === discordClient.id) return true;

			const memberRoles = guild?.currentMember?.roles ?? [];

			if (this.permission_overwritees) {
				const memberOverwrite = this.permission_overwritees.find((overwrite) => (overwrite.type === ChannelPermissionOverwriteType.Member || (overwrite.type as any) === 1) && overwrite.id === discordClient.id);
				if (memberOverwrite) {
					if ((BigInt(memberOverwrite.allow) & (1n << 11n)) !== 0n) return true;
					if ((BigInt(memberOverwrite.deny) & (1n << 11n)) !== 0n) return false;
				}

				for (const roleId of memberRoles) {
					const roleOverwrite = this.permission_overwritees.find((overwrite) => (overwrite.type === ChannelPermissionOverwriteType.Role || (overwrite.type as any) === 0) && overwrite.id === roleId);
					if (roleOverwrite && (BigInt(roleOverwrite.allow) & (1n << 11n)) !== 0n) return true;
				}

				for (const roleId of memberRoles) {
					const role = guild?.roles ? guild.roles.cached().get(roleId) : undefined;
					if (role?.permissions && (BigInt(role.permissions) & (1n << 3n)) !== 0n) return true;
				}

				const everyoneOverwrite = this.permission_overwritees.find((overwrite) => overwrite.id === this.guildId);
				if (everyoneOverwrite && (BigInt(everyoneOverwrite.deny) & (1n << 11n)) !== 0n) return false;
			}
		}

		if (this.permissions) {
			const perms = BigInt(this.permissions);
			if ((perms & (1n << 3n)) !== 0n) return true;
			if (this.category === ChannelCategory.Voice) return (perms & (1n << 11n)) !== 0n && (perms & (1n << 10n)) !== 0n;
			return (perms & (1n << 11n)) !== 0n;
		}

		if (this.is_viewable_and_writeable_by_all_members === false) return false;

		return true;
	};

	async getAllowedAccess(): Promise<{ roles: Role[]; rolePlaceholders: string[]; members: (User<boolean> | string)[] }> {
		const roles: Role[] = [];
		const rolePlaceholders: string[] = [];
		const members: (User<boolean> | string)[] = [];

		if (!this.permission_overwritees) return { roles, rolePlaceholders, members };

		const guild = this.guildId ? await discordClient.guilds.get(this.guildId) : null;

		for (const overwrite of this.permission_overwritees) {
			const allow = BigInt(overwrite.allow);
			if ((allow & (1n << 10n)) !== 0n) {
				if (overwrite.type === ChannelPermissionOverwriteType.Role || (overwrite.type as any) === 0) {
					if (overwrite.id === this.guildId) rolePlaceholders.push("@everyone");
					else {
						const role = guild?.roles ? guild.roles.cached().get(overwrite.id) : undefined;
						if (role) roles.push(role);
						else rolePlaceholders.push(`Role (${overwrite.id})`);
					}
				} else {
					const user = await discordClient.users.get(overwrite.id);
					members.push(user ?? `User (${overwrite.id})`);
				}
			}
		}

		return { roles, rolePlaceholders, members };
	};

	get isAgeRestricted(): boolean {
		return !!this.nsfw;
	};

	get baseIconName(): string {
		switch (this.type) {
			case ChannelType.GuildText: return "hash";

			case ChannelType.GuildVoice: return "user-sound";

			case ChannelType.GuildStageVoice: return "video-conference";

			case ChannelType.GuildNews: return "cell-tower";

			case ChannelType.GuildForum:
			case ChannelType.GuildMedia: return "chats-teardrop";

			case ChannelType.PublicThread:
			case ChannelType.PrivateThread:
			case ChannelType.NewsThread: return "envelope-simple-open";

			default: return "hash";
		}
	};

	get badgeIconNames(): string[] {
		const badges: string[] = [];

		if (this.isPrivate) {
			if (this.isAccessible) badges.push("shield");
			else badges.push("lock-simple");
		}

		if (this.isAgeRestricted) badges.push("warning");
		return badges;
	};

	async getIconElement(): Promise<HTMLElement> {
		const iconContainer = document.createElement("div");
		iconContainer.classList.add("channel-icon");

		const mainIconSvg = await getIcon(this.baseIconName);
		const mainIcon = document.createElement("span");
		mainIcon.classList.add("main-icon");
		mainIcon.innerHTML = mainIconSvg;
		iconContainer.append(mainIcon);

		for (const badgeName of this.badgeIconNames) {
			const badgeSvg = await getIcon(badgeName);
			if (badgeSvg) {
				const badgeElement = document.createElement("span");
				badgeElement.classList.add("badge", badgeName);
				badgeElement.innerHTML = badgeSvg;
				iconContainer.append(badgeElement);
			}
		}

		return iconContainer;
	};

	async requestChannelMemberCount() {
		await discordClient.send({
			op: GatewayOpCode.RequestChannelMemberCount,
			d: {
				guild_id: this.guildId,
				channel_ids: [this.id]
			}
		});

		await discordClient.awaitEvent(GatewayDispatchEvent.GuildMemberListUpdate, (data: any) => data.channel_id === this.id);
	};

	async listMessages(options?: ChannelMessagesOptions | number): Promise<Message[]> {
		const searchParams = new URLSearchParams();
		if (typeof options === "number") searchParams.set("limit", options.toString());
		else if (options) {
			if (options.around) searchParams.set("around", options.around);
			if (options.before) searchParams.set("before", options.before);
			if (options.after) searchParams.set("after", options.after);
			if (options.limit) searchParams.set("limit", options.limit.toString());
		}

		const query = searchParams.size > 0 ? `?${searchParams.toString()}` : "";
		const response = await discordClient.rest.request(`/channels/${this.id}/messages${query}`);
		const data = await response.json();
		const list = data.map((messageData: any) => new Message(messageData));
		return list.reverse();
	};
};

export interface ChannelMessagesOptions {
	around?: Snowflake;
	before?: Snowflake;
	after?: Snowflake;
	limit?: number;
};

export class ChannelCollection extends Collection<Channel | Channel<true>> {
	constructor(channels?: any[], guildId?: Snowflake) {
		super();

		if (channels) for (const data of channels) {
			const channel = data instanceof Channel ? data : new Channel({ ...data, guildId: data.guildId ?? data.guild_id ?? guildId });
			this.set(channel.id, channel);
		}
	};

	async fetch<Partial extends boolean = false>(id: Snowflake, guild?: Snowflake): Promise<Channel<Partial>> {
		let response: Response;
		if (guild) response = await discordClient.rest.request(`/users/@me/dms/${id}`);
		else response = await discordClient.rest.request(`/channels/${id}`);

		const channel = new Channel<Partial>(await response.json());
		if (discordClient.guilds.has(channel.guildId ?? "")) {
			const guild = await discordClient.guilds.get(channel.guildId ?? "");
			guild!.channels.patch(channel.id, channel);
		}
		return channel;
	};
};