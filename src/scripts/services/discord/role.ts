import { Collection } from "/scripts/lib/utils.ts";

export class Role {
	id!: string;
	name!: string;
	color!: number;

	constructor(data: any) {
		Object.assign(this, data);
	};
};

export class RoleCollection extends Collection<Role> {
	constructor(roles?: any[]) {
		super();

		if (roles) {
			for (const data of roles) this.set(data.id, new Role(data));
		}
	};
};