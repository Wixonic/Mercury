let currentCleanup: (() => void) | null = null;

export const view = async (path: string): Promise<void> => {
	if (currentCleanup) {
		try {
			currentCleanup();
		} catch (error) {
			console.error(`Error during cleanup of previous view:`, error);
		}

		currentCleanup = null;
	}

	const response = await fetch(`/views/${path}/index.html`);
	if (!response.ok) throw new Error(`View not found for path: ${path}`);
	document.body.innerHTML = await response.text();

	try {
		const module = await import(`/views/${path}/index.js`);

		if (typeof module.default === "function") {
			const cleanup = module.default();
			if (typeof cleanup === "function") currentCleanup = cleanup;
		}

		if (typeof module.init === "function") {
			const cleanup = module.init();
			if (typeof cleanup === "function") currentCleanup = cleanup;
			else if (typeof module.destroy === "function") currentCleanup = module.destroy;
			else if (typeof module.cleanup === "function") currentCleanup = module.cleanup;
		}
	} catch { }
};