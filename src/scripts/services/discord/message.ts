import { Channel } from "/scripts/services/discord/channel.ts";
import { Snowflake } from "/scripts/services/discord/snowflake.ts";
import { Sticker } from "/scripts/services/discord/sticker.ts";
import { User } from "/scripts/services/discord/user.ts";

import { Collection, PartialType } from "/scripts/lib/utils.ts";

import { discordClient } from "/main.ts";

// timestamp_ms % 13
export enum UserJoinMessageType {
	// "{author} joined the party."
	Default = 0,
	// "{author} is here."
	IsHere = 1,
	// "Welcome, {author}. We hope you brought pizza."
	Pizza = 2,
	// "A wild {author} appeared."
	Wild = 3,
	// "{author} just landed."
	Landing = 4,
	// "{author} just slid into the server."
	Sliding = 5,
	// "{author} just showed up!"
	ShowedUp = 6,
	// "Welcome {author}. Say hi!"
	Greetings = 7,
	// "{author} hopped into the server."
	Hopped = 8,
	// "Everyone welcome {author}!"
	EveryoneWelcome = 9,
	// "Glad you're here, {author}."
	Glad = 10,
	// "Good to see you, {author}."
	GoodToSeeYou = 11,
	// "Yay you made it, {author}!"
	MadeIt = 12
};

export enum MessageType {
	// "{content}"
	Default = 0,
	// "{author} added {mentions[0]} to the {group/thread}."
	RecipientAdd = 1,
	// "{author} removed {mentions[0]} from the {group/thread}."
	RecipientRemove = 2,
	// participated ? "{author} started a call{ended ? " that lasted {duration}" : " — Join the call"}." : "You missed a call from {author} that lasted {duration}."
	Call = 3,
	// "{author} {content ? "changed the {is_forum ? "post title" : "channel name"}: {content} ." : "removed the custom group name." }"
	ChannelNameChange = 4,
	// "{author} changed the channel icon."
	ChannelIconChange = 5,
	// "{author} pinned a message to this channel."
	ChannelPinnedMessage = 6,
	UserJoin = 7,
	// "{author} just boosted the server{content ? " {content} times"}!"
	PremiumGuildSubscription = 8,
	// "{author} just boosted the server{content ? " {content} times"}! {guild} has achieved Level 1!"
	PremiumGuildSubscriptionTier1 = 9,
	// "{author} just boosted the server{content ? " {content} times"}! {guild} has achieved Level 2!"
	PremiumGuildSubscriptionTier2 = 10,
	// "{author} just boosted the server{content ? " {content} times"}! {guild} has achieved Level 3!"
	PremiumGuildSubscriptionTier3 = 11,
	// "{author} has added {content} to this channel. Its most important updates will show up here."
	ChannelFollowAdd = 12,
	// "This server has been removed from Server Discovery because it no longer passes all the requirements. Check Server Settings for more details."
	GuildDiscoveryDisqualified = 14,
	// "This server is eligible for Server Discovery again and has been automatically relisted!"
	GuildDiscoveryRequalified = 15,
	// "This server has failed Discovery activity requirements for 1 week. If this server fails for 4 weeks in a row, it will be automatically removed from Discovery."
	GuildDiscoveryGracePeriodInitialWarning = 16,
	// "This server has failed Discovery activity requirements for 3 weeks in a row. If this server fails for 1 more week, it will be removed from Discovery."
	GuildDiscoveryGracePeriodFinalWarning = 17,
	// "{author} started a thread: {content}. See all threads."
	ThreadCreated = 18,
	// "{content}"
	Reply = 19,
	// "{content}"
	ChatInputCommand = 20,
	// "{referenced_message?.content}" ?? "Sorry, we couldn't load the first message in this thread"
	ThreadStarterMessage = 21,
	// "Wondering who to invite?\nStart by inviting anyone who can help you build the server!"
	GuildInviteReminder = 22,
	// "{content}"
	ContextMenuCommand = 23,
	// Special embed rendered from embeds[0]
	AutoModerationAction = 24,
	// "{author} {is_renewal ? "renewed" : "joined"} {role_subscription.tier_name} and has been a subscriber of {guild} for {role_subscription.total_months_subscribed} month(?s)!"
	RoleSubscriptionPurchase = 25,
	// "{content}"
	InteractionPremiumUpsell = 26,
	// "{author} started {content} "
	StageStart = 27,
	// "{author} ended {content} "
	StageEnd = 28,
	// "{author} is now a speaker."
	StageSpeaker = 29,
	// "{author} requested to speak."
	StageRaiseHand = 30,
	// "{author} changed the Stage topic: {content} "
	StageTopic = 31,
	// "{author} upgraded {application ?? "a deleted application"} to premium for this server!"
	GuildApplicationPremiumSubscription = 32,
	// "{content}"
	PremiumReferral = 35,
	// "{author} enabled security actions until {content}."
	GuildIncidentAlertModeEnabled = 36,
	// "{author} disabled security actions."
	GuildIncidentAlertModeDisabled = 37,
	// "{author} reported a raid in {guild}."
	GuildIncidentReportRaid = 38,
	// "{author} reported a false alarm in {guild}."
	GuildIncidentReportFalseAlarm = 39,
	// "{content}"
	GuildDeadchatRevivePrompt = 40,
	// Special embed rendered from embeds[0].url and gift_info
	CustomGift = 41,
	// "{content}"
	GuildGamingStatsPrompt = 42,
	// "{author} has purchased {purchase_notification.guild_product_purchase.product_name}!"
	PurchaseNotification = 44,
	// Special embed rendered from embeds[0]
	PollResult = 46,
	// "{content}"
	Changelog = 47,
	// Special embed rendered from content
	NitroNotification = 48,
	// "{content}"
	ChannelLinkedToLobby = 49,
	// Special embed
	GiftingPrompt = 50,
	// "{author} messaged you from {application.name}. In-game chat may not include rich messaging features such as images, polls, or apps. Learn More "
	InGameMessageNux = 51,
	// "{join_request.user}'s application to {content} was approved! Welcome!"
	GuildJoinRequestAcceptNotification = 52,
	// "{join_request.user}'s application to {content} was rejected."
	GuildJoinRequestRejectNotification = 53,
	// "{join_request.user}'s application to {content} has been withdrawn."
	GuildJoinRequestWithdrawnNotification = 54,
	// "{author} activated HD Splash Potion "
	HdStreamingUpgraded = 55,
	// "{author} deleted the message"
	ReportToModDeletedMessage = 58,
	// "{author} timed out {mentions[0]}"
	ReportToModTimeoutUser = 59,
	// "{author} kicked {mentions[0]}"
	ReportToModKickUser = 60,
	// "{author} banned {mentions[0]}"
	ReportToModBanUser = 61,
	// "{author} resolved this flag"
	ReportToModClosedReport = 62,
	// Special embed
	PremiumGroupInvite = 64,
	// "{author} started a [voice hangout]({channel})."
	VoiceSession = 65,
	// Special embed
	GuildBoostUpsell = 66,
	// "{author} accepted your friend request."
	FriendRequestAccepted = 67,
	MediaMentionMessage = 68
};

const MessageFlags = {
	Crossposted: 1n << 0n,
	IsCrosspost: 1n << 1n,
	SuppressEmbeds: 1n << 2n,
	SourceMessageDeleted: 1n << 3n,
	Urgent: 1n << 4n,
	HasThread: 1n << 5n,
	Ephemeral: 1n << 6n,
	Loading: 1n << 7n,
	FailedToMentionSomeRolesInThread: 1n << 8n,
	GuildFeedHidden: 1n << 9n,
	ShouldShowLinkNotDiscordWarning: 1n << 10n,
	SuppressNotifications: 1n << 12n,
	IsVoiceMessage: 1n << 13n,
	HasSnapshot: 1n << 14n,
	IsComponentsV2: 1n << 15n,
	SentBySocialLayerIntegration: 1n << 16n,
	HiddenSuspendedUser: 1n << 17n,
	IsFirstBooster: 1n << 18n,
	IsGuildOfficial: 1n << 19n
} as const;
export type MessageFlags = typeof MessageFlags[keyof typeof MessageFlags];


export class Message<Partial extends boolean = false> {
	id: Snowflake;
	lobby_id?: Snowflake;
	channel_id: Snowflake;
	type: MessageType;
	content: string;
	author: User<true>;
	activity?: MessageRichPresenceActivity;
	application?: MessageRichPresenceApplication;
	application_id?: Snowflake;
	parent_application_id?: Snowflake;
	flags: MessageFlags;
	channel?: Channel;
	moderation_metadata?: Record<string, string>;

	timestamp!: PartialType<Date, Partial>;
	edited_timestamp?: PartialType<Date, Partial>;
	tts!: PartialType<boolean, Partial>;
	mention_everyone!: PartialType<boolean, Partial>;
	mentions!: PartialType<(User | User<true>)[], Partial>;
	mention_roles!: PartialType<Snowflake[], Partial>;
	mention_channels?: PartialType<(Channel | Channel<true>)[], Partial>;
	attachments!: PartialType<Attachment[], Partial>;
	embeds!: PartialType<Embed[], Partial>;
	reactions?: PartialType<Reaction[], Partial>;
	nonce?: PartialType<number | string, Partial>;
	pinned!: PartialType<boolean, Partial>;
	webhook_id?: PartialType<Snowflake, Partial>;
	message_reference?: PartialType<MessageReference, Partial>;
	referenced_message?: PartialType<Message, Partial>;
	message_snapshots?: PartialType<MessageSnapshot[], Partial>;
	call?: PartialType<MessageCall, Partial>;
	interaction_metadata?: PartialType<MessageInteraction, Partial>;
	resolved?: PartialType<ResolvedData, Partial>;
	thread?: PartialType<Channel, Partial>;
	role_subscription_data?: PartialType<MessageRoleSubscription, Partial>;
	purchase_notification?: PartialType<MessagePurchaseNotification, Partial>;
	gift_info?: PartialType<MessageGiftInfo, Partial>;
	components!: PartialType<MessageComponent[], Partial>;
	sticker_items?: PartialType<StickerItem[], Partial>;
	stickers?: PartialType<Sticker[], Partial>;
	poll?: PartialType<Poll, Partial>;
	changelog_id?: PartialType<Snowflake, Partial>;
	soundboard_sounds?: PartialType<SoundboardSound[], Partial>;
	potions?: PartialType<Potion[], Partial>;
	shared_client_theme?: PartialType<SharedClientTheme, Partial>;

	constructor(data: any) {
		const Partial = data.timestamp === undefined;

		this.id = data.id;
		if (data.lobby_id) this.lobby_id = data.lobby_id;
		this.channel_id = data.channel_id;
		this.type = data.type ?? MessageType.Default;
		this.content = data.content;
		this.author = new User(data.author);
		discordClient.users.patch(this.author.id, this.author);
		if (data.activity) this.activity = data.activity;
		if (data.application) this.application = data.application;
		if (data.application_id) this.application_id = data.application_id;
		if (data.parent_application_id) this.parent_application_id = data.parent_application_id;
		this.flags = data.flags;
		if (data.channel) this.channel = new Channel(data.channel);
		this.moderation_metadata = data.moderation_metadata;

		if (!Partial) {
			this.timestamp = new Date(data.timestamp);
			if (data.edited_timestamp) this.edited_timestamp = new Date(data.edited_timestamp);
			this.tts = data.tts;
			this.mention_everyone = data.mention_everyone;
			this.mentions = data.mentions;
			this.mention_roles = data.mention_roles;
			this.mention_channels = data.mention_channels;
			this.attachments = data.attachments;
			this.embeds = data.embeds;
			this.reactions = data.reactions;
			this.nonce = data.nonce;
			this.pinned = data.pinned;
			this.webhook_id = data.webhook_id;
			this.message_reference = data.message_reference;
			if (data.referenced_message) this.referenced_message = new Message(data.referenced_message);
			this.message_snapshots = data.message_snapshots;
			this.call = data.call;
			this.interaction_metadata = data.interaction_metadata;
			this.resolved = data.resolved;
			if (data.thread) this.thread = new Channel(data.thread);
			this.role_subscription_data = data.role_subscription_data;
			this.purchase_notification = data.purchase_notification;
			this.gift_info = data.gift_info;
			this.components = data.components;
			this.sticker_items = data.sticker_items;
			if (data.stickers) this.stickers = data.stickers.map((sticker: any) => new Sticker(sticker));
			this.poll = data.poll;
			this.changelog_id = data.changelog_id;
			this.soundboard_sounds = data.soundboard_sounds;
			this.potions = data.potions;
			this.shared_client_theme = data.shared_client_theme;
		}
	};

	render(): string {
		return "";
	};
};

export class MessageCollection extends Collection<Message | Message<true>> {

};