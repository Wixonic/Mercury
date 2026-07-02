import { Collection } from "/scripts/lib/utils.ts";

import { CDNElement } from "/scripts/services/discord/cdn.ts";

export class Sticker extends CDNElement {
	id!: string;
	name!: string;

	constructor(data: any) {
		super("/stickers", data.id);

		Object.assign(this, data);
	};
};

export class StickerCollection extends Collection<Sticker> {
	constructor(stickers?: any[]) {
		super();
		if (stickers) {
			for (const data of stickers) this.set(data.id, new Sticker(data));
		}
	};
};