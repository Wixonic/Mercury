import { Collection, Loaded } from "/scripts/lib/utils.ts";

import { CDNElement } from "/scripts/services/discord/cdn.ts";
import { Snowflake } from "/scripts/services/discord/snowflake.ts";

import { discordClient } from "/main.ts";

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

export class User<Ready extends boolean = true> {
	id: string;

	constructor(id: string) {
		this.id = id;
	};
};

export class UserCollection extends Collection<User | User<false>> {

};