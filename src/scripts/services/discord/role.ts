import { Collection } from "/scripts/lib/utils.ts";
import { CDNElement } from "/scripts/services/discord/cdn.ts";

export class Role {
	id: string;
	name: string;
	color: number;
	icon?: CDNElement;
	unicode_emoji?: string;
	permissions?: string;
	position?: number;

	constructor(data: any) {
		this.id = data.id;
		this.name = data.name;
		this.color = data.color ?? 0;
		if (data.icon) this.icon = new CDNElement(`/role-icons/${data.id}`, data.icon);
		if (data.unicode_emoji) this.unicode_emoji = data.unicode_emoji;
		if (data.permissions) this.permissions = data.permissions;
		if (data.position !== undefined) this.position = data.position;
	};
};

export class RoleCollection extends Collection<Role> {
	constructor(roles?: any[]) {
		super();

		if (roles) for (const data of roles) this.set(data.id, data instanceof Role ? data : new Role(data));
	};
};