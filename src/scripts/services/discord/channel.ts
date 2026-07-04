import { Collection, Loaded } from "/scripts/lib/utils.ts";

import { CDNElement } from "/scripts/services/discord/cdn.ts";
import { GatewayDispatchEvent, GatewayOpCode } from "/scripts/services/discord/gateway.ts";
import { ChannelSettings } from "/scripts/services/discord/settings.ts";
import type { Snowflake } from "/scripts/services/discord/snowflake.ts";
import type { User } from "/scripts/services/discord/user.ts";

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
	member?: Snowflake;
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

export interface ForumDefaultReaction {
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

export class Channel<Ready extends boolean = true> {
	id!: Snowflake;
	type!: ChannelType;
	name?: string;
	recipients?: Snowflake[];
	icon?: CDNElement;
	guildId?: Snowflake;

	position?: Loaded<number, Ready>;
	permission_overwritees?: Loaded<ChannelPermissionOverwrite[], Ready>;
	topic?: Loaded<string, Ready>;
	nsfw?: Loaded<boolean, Ready>;
	last_message_id?: Loaded<Snowflake, Ready>;
	last_pin_timestamp?: Loaded<Date, Ready>;
	bitrate?: Loaded<number, Ready>;
	user_limit?: Loaded<number, Ready>;
	rate_limit_per_user?: Loaded<number, Ready>;
	recipient_flags?: Loaded<ChannelRecipientFlags[], Ready>;
	nicks?: Loaded<ChannelNick[], Ready>;
	managed?: Loaded<boolean, Ready>;
	blocked_user_warning_dismissed?: Loaded<boolean, Ready>;
	safety_warnings?: Loaded<ChannelSafetyWarning[], Ready>;
	application_id?: Loaded<Snowflake, Ready>;
	owner_id?: Loaded<Snowflake, Ready>;
	owner?: Loaded<Snowflake, Ready>;
	parent_id?: Loaded<Snowflake, Ready>;
	rtc_region?: Loaded<ChannelVoiceRegion, Ready>;
	video_quality_mode?: Loaded<ChannelVideoQualityMode, Ready>;
	total_message_sent?: Loaded<number, Ready>;
	message_count?: Loaded<number, Ready>;
	member_count?: Loaded<number, Ready>;
	member_ids_preview?: Loaded<Snowflake[], Ready>;
	thread_metadata?: Loaded<ThreadMetadata, Ready>;
	member?: Loaded<ThreadMember, Ready>;
	default_auto_archive_duration?: Loaded<number, Ready>;
	default_thread_rate_limit_per_user?: Loaded<number, Ready>;
	permissions?: Loaded<string, Ready>;
	flags?: Loaded<ChannelFlags, Ready>;
	available_tags?: Loaded<ForumTag[], Ready>;
	applied_tags?: Loaded<Snowflake[], Ready>;
	default_reaction_emoji?: Loaded<ForumDefaultReaction, Ready>;
	default_forum_layout?: Loaded<ForumLayoutType, Ready>;
	default_sort_order?: Loaded<ForumSortOrderType, Ready>;
	default_tag_setting?: Loaded<ForumSearchTagSetting, Ready>;
	is_message_request?: Loaded<boolean, Ready>;
	is_message_request_timestamp?: Loaded<Date, Ready>;
	is_spam?: Loaded<boolean, Ready>;
	status?: Loaded<string, Ready>;
	hd_streaming_until?: Loaded<Date, Ready>;
	hd_streaming_buyer_id?: Loaded<Snowflake, Ready>;
	linked_lobby?: Loaded<LinkedLobby, Ready>;
	is_linkable?: Loaded<boolean, Ready>;
	is_viewable_and_writeable_by_all_members?: Loaded<boolean, Ready>;
	template?: Loaded<string, Ready>;
	version?: Loaded<string, Ready>;

	get settings(): ChannelSettings | undefined {
		if (!this.guildId) return undefined;
		return discordClient.settings?.guilds?.guilds[this.guildId]?.channels[this.id];
	};

	constructor(data: any) {
		Object.assign(this, data);

		if (data.recipients) this.recipients = data.recipients.map((recipient: User<false>) => recipient.id);
		if (data.icon) this.icon = new CDNElement(`/channels/${data.id}/icons`, data.icon);

		if (data.last_pin_timestamp) this.last_pin_timestamp = new Date(data.last_pin_timestamp);
		if (data.safety_warnings) this.safety_warnings = data.safety_warnings.map((safety_warning: any) => ({
			...safety_warning,
			expiry: new Date(safety_warning.expiry),
			dismiss_timestamp: safety_warning.dismiss_timestamp ? new Date(safety_warning.dismiss_timestamp) : null
		}));
		if (data.owner) this.owner = data.owner.user.id;
		if (data.thread_metadata) this.thread_metadata = {
			...data.thread_metadata,
			archive_timestamp: new Date(data.thread_metadata.archive_timestamp),
			create_timestamp: data.thread_metadata.create_timestamp ? new Date(data.thread_metadata.create_timestamp) : null
		};
		if (data.member) this.member = {
			...data.member,
			join_timestamp: new Date(data.member.join_timestamp),
			mute_config: data.member.mute_config ? {
				...data.member.mute_config,
				end_time: data.member.mute_config.end_time ? new Date(data.member.mute_config.end_time) : null
			} : null,
			member: data.member.member ? data.member.member.user.id : null
		};
		if (data.is_message_request_timestamp) this.is_message_request_timestamp = new Date(data.is_message_request_timestamp);
		if (data.hd_streaming_until) this.hd_streaming_until = new Date(data.hd_streaming_until);
		if (data.linked_lobby) this.linked_lobby = {
			...data.linked_lobby,
			linked_at: new Date(data.linked_lobby.linked_at)
		};
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
};

export class ChannelCollection extends Collection<Channel | Channel<false>> {
	async fetch<Partial extends boolean = false>(id: Snowflake, guild?: Snowflake): Promise<Channel<Partial extends true ? false : true>> {
		let response: Response;
		if (guild) response = await discordClient.rest.request(`/users/@me/dms/${id}`);
		else response = await discordClient.rest.request(`/channels/${id}`);
		return new Channel<Partial>(await response.json());
	};
};