export class Collection<T> {
	private cache: Map<string, T> = new Map();

	constructor(initialItems?: Record<string, T>) {
		if (initialItems) for (const [key, value] of Object.entries(initialItems)) this.cache.set(key, value);
	};

	async get(key: string, force?: boolean, cached = true): Promise<T | undefined> {
		return (!cached || force || !this.cache.has(key)) ? await this.fetch(key) : this.cache.get(key);
	};

	async fetch(key: string): Promise<T | undefined> {
		throw new Error(`Cannot fetch element "${key}": method not implemented.`);
	};

	set(key: string, value: T): void {
		this.cache.set(key, value);
	};

	has(key: string): boolean {
		return this.cache.has(key);
	};

	delete(key: string): void {
		this.cache.delete(key);
	};

	clear(): void {
		this.cache.clear();
	};
};
export type Loaded<T, IsLoaded extends boolean> = IsLoaded extends true ? T : T | undefined;