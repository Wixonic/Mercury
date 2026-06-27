import { Collection } from "/scripts/lib/utils.ts";

import { CDNElement } from "/scripts/services/discord/cdn.ts";
import type { Snowflake } from "/scripts/services/discord/snowflake.ts";

export class Sticker<T extends boolean = true> extends CDNElement {

};

export class StickerCollection extends Collection<Sticker | Sticker<false>> {

};