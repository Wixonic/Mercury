import { Permission } from "/scripts/services/discord/permission.ts";

import { Collection } from "/scripts/lib/utils.ts";

export class Role {
	id: string;
	name: string;
	color: number;

	constructor(data: any) {
		this.id = data.id;
		this.name = data.name;
		this.color = data.color;
	};
};

export class RoleCollection extends Collection<Role> {
	constructor(roles?: any[]) {
		super();

		if (roles) for (const data of roles) this.set(data.id, new Role(data));
	};
};