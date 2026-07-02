import { Collection } from "/scripts/lib/utils.ts";

import { CDNElement } from "/scripts/services/discord/cdn.ts";

export class Emoji extends CDNElement {
	id!: string;
	name!: string;
	private _animated!: boolean;

	constructor(data: any) {
		super("/emojis", data.id);

		const { animated, ...rest } = data;
		Object.assign(this, rest);
		this._animated = animated;
	};

	override get animated(): boolean {
		return this._animated;
	};
};

export class EmojiCollection extends Collection<Emoji> {
	constructor(emojis?: any[]) {
		super();

		if (emojis) {
			for (const data of emojis) this.set(data.id, new Emoji(data));
		}
	};
};