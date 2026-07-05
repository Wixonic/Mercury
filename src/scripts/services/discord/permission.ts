export class Permission {
	value: bigint;

	constructor(value: string) {
		this.value = BigInt(value);
	};

	toString(radix?: number): string {
		return this.value.toString(radix);
	};
};