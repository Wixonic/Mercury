import { Collection } from "/scripts/lib/utils.ts";

import { CDNElement } from "/scripts/services/discord/cdn.ts";

export class Emoji extends CDNElement {
	id: string;
	name: string;

	constructor(data: any) {
		super("/emojis", data.id);

		this.id = data.id;
		this.name = data.name;
	};
};

export class EmojiCollection extends Collection<Emoji> {
	constructor(emojis?: any[]) {
		super();

		if (emojis) for (const data of emojis) this.set(data.id, new Emoji(data));
	};
};