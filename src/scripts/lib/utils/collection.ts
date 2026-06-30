export class Collection<T> {
	private cache: Map<string, T> = new Map();
	private pending: Map<string, Promise<T | undefined>> = new Map();

	constructor(initialItems?: Record<string, T>) {
		if (initialItems) for (const [key, value] of Object.entries(initialItems)) this.cache.set(key, value);
	};

	async get(key: string, force?: boolean, cached = true): Promise<T | undefined> {
		if (cached && !force && this.cache.has(key)) {
			return this.cache.get(key);
		}

		if (this.pending.has(key)) {
			return this.pending.get(key);
		}

		const promise = this.fetch(key).then((item) => {
			this.pending.delete(key);
			if (item !== undefined) this.cache.set(key, item);
			return item;
		}).catch((error) => {
			this.pending.delete(key);
			throw error;
		});

		this.pending.set(key, promise);
		return promise;
	};

	async fetch(key: string): Promise<T | undefined> {
		throw new Error(`Cannot fetch element "${key}": method not implemented.`);
	};

	cached() {
		return this.cache;
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