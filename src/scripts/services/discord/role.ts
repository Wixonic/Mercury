import { Collection } from "/scripts/lib/utils.ts";

import { CDNElement } from "/scripts/services/discord/cdn.ts";
import type { Snowflake } from "/scripts/services/discord/snowflake.ts";

export class Role<T extends boolean = true> extends CDNElement {

};

export class RoleCollection extends Collection<Role | Role<false>> {

};