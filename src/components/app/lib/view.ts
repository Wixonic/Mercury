let styleElement: HTMLLinkElement | null = null;
let cleanup: (() => void) | null = null;
let currentView: string | null = null;
let currentNavigationId = 0;
let currentAbortController: AbortController | null = null;

interface RenderResult {
	title?: string;
	cleanup?: () => void;
};

interface ViewModule {
	render(container: HTMLElement, params: URLSearchParams): Promise<RenderResult | void> | RenderResult | void;
};

export const view = async (path: string): Promise<void> => {
	if (currentView === path) return;
	currentView = path;

	const navigationId = ++currentNavigationId;

	if (currentAbortController) currentAbortController.abort();
	currentAbortController = new AbortController();
	const { signal } = currentAbortController;

	const url = new URL(path, window.location.origin);
	const pathname = url.pathname;
	const params = url.searchParams;

	const resolvedPathname = pathname.startsWith("/views/") ? `/components/app/views/${pathname.substring("/views/".length)}` : pathname;

	const htmlPath = resolvedPathname + url.search;
	const baseName = resolvedPathname.replace(/\.[^/.]+$/, "");
	const cssPath = `${baseName}.css`;
	const jsPath = `${baseName}.js`;

	if (cleanup) {
		try {
			cleanup();
		} catch (error) {
			console.error("Error cleaning up previous view:", error);
		}
		cleanup = null;
	}

	if (styleElement) {
		styleElement.remove();
		styleElement = null;
	}

	try {
		const htmlPromise = fetch(htmlPath, { signal }).then(async (response) => {
			if (!response.ok) throw new Error(`Failed to fetch HTML for view: ${response.statusText}`);
			return response.text();
		});

		const cssPromise = fetch(cssPath, { method: "HEAD", signal })
			.then((response) => response.ok)
			.catch(() => false);

		const jsPromise = import(jsPath)
			.catch((error) => {
				console.warn(`Could not import script for view: ${jsPath}`, error);
				return null;
			});

		const [htmlText, cssExists, module] = await Promise.all([
			htmlPromise,
			cssPromise,
			jsPromise
		]);

		if (navigationId !== currentNavigationId) return;

		const mainElement = document.querySelector("main");
		if (!mainElement) throw new Error("Target main element not found in document");

		if (cssExists) {
			const link = document.createElement("link");
			link.rel = "stylesheet";
			link.href = cssPath;
			document.head.append(link);
			styleElement = link;

			await new Promise<void>((resolve) => {
				link.addEventListener("load", () => resolve());
				link.addEventListener("error", () => {
					link.remove();
					if (styleElement === link) styleElement = null;

					resolve();
				});
			});

			if (navigationId !== currentNavigationId) {
				link.remove();
				if (styleElement === link) styleElement = null;
				return;
			}
		}

		mainElement.innerHTML = htmlText;

		if (module) {
			try {
				const result = await (module as ViewModule).render(mainElement, params);

				if (result && navigationId === currentNavigationId) {
					if (result.title) {
						const titleElement = document.querySelector("header.titlebar .location");
						if (titleElement) titleElement.innerHTML = result.title;
					}
					if (result.cleanup) cleanup = result.cleanup;
				}
			} catch (error) {
				console.error(`Error rendering view for path: ${path}`, error);
			}
		}
	} catch (error) {
		if (error instanceof Error && error.name === "AbortError") return;
		throw error;
	}
};