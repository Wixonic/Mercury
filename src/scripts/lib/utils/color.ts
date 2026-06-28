export class Color {
	static fromHex(hex: string): Color {
		let cleanHex = hex;
		if (cleanHex.startsWith("#")) cleanHex = cleanHex.slice(1);

		const value = parseInt(cleanHex, 16);
		return new Color(value);
	};

	static fromRGB(r: number, g: number, b: number): Color {
		const value = (r << 16) + (g << 8) + b;
		return new Color(value);
	};

	value: number;

	constructor(value: number) {
		this.value = value;
	};

	get r(): number {
		return (this.value >> 16) & 0xFF;
	};

	get g(): number {
		return (this.value >> 8) & 0xFF;
	};

	get b(): number {
		return this.value & 0xFF;
	};

	get rgb(): [number, number, number] {
		return [this.r, this.g, this.b];
	};

	get hex(): string {
		return `#${this.value.toString(16).padStart(6, "0")}`;
	};

	toJSON(): number {
		return this.value;
	};
};