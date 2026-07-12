import { Attachment } from "/scripts/services/discord/attachment.ts";
import { Channel } from "/scripts/services/discord/channel.ts";
import { GuildMember } from "/scripts/services/discord/guildMember";
import { Message } from "/scripts/services/discord/message.ts";
import { Role } from "/scripts/services/discord/role.ts";
import { Snowflake } from "/scripts/services/discord/snowflake.ts";
import { User } from "/scripts/services/discord/user.ts";

export interface ResolvedData {
	attachments?: Record<Snowflake, Attachment>;
	channels?: Record<Snowflake, Channel<true>>;
	members?: Record<Snowflake, GuildMember>;
	messages?: Record<Snowflake, Message>;
	roles?: Record<Snowflake, Role>;
	users?: Record<Snowflake, User<true>>;
};

export const resolveData = (data: any): ResolvedData => {
	if (data.attachments) for (const [id, attachment] of Object.entries(data.attachments)) data.attachments[id] = new Attachment(attachment);
	if (data.channels) for (const [id, channel] of Object.entries(data.channels)) data.channels[id] = new Channel(channel);
	if (data.members) for (const [id, member] of Object.entries(data.members)) data.members[id] = new GuildMember(member);
	if (data.messages) for (const [id, message] of Object.entries(data.messages)) data.messages[id] = new Message(message);
	if (data.roles) for (const [id, role] of Object.entries(data.roles)) data.roles[id] = new Role(role);
	if (data.users) for (const [id, user] of Object.entries(data.users)) data.users[id] = new User(user);
	return data;
};