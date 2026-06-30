let styleElement: HTMLLinkElement | null = null;
let cleanup: (() => void) | null = null;
let currentView: string | null = null;

export const view = async (path: string): Promise<void> => {
	if (currentView === path) return;
	currentView = path;

	let resolvedPath = path;
	if (path.startsWith("/views/")) resolvedPath = `/components/app/views/${path.substring("/views/".length)}`;

	const params = new URLSearchParams(path.split("?")[1]);
	console.log("View params:", params.toString());

	const htmlPath = resolvedPath;
	const baseName = resolvedPath.substring(0, resolvedPath.lastIndexOf("."));
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

	const mainElement = document.querySelector("main")!;

	const response = await fetch(htmlPath);
	if (!response.ok) throw new Error(`Failed to fetch HTML for view: ${response.statusText}`);
	mainElement.innerHTML = await response.text();

	try {
		const cssCheck = await fetch(cssPath, { method: "HEAD" });
		if (cssCheck.ok) {
			const link = document.createElement("link");
			link.rel = "stylesheet";
			link.href = cssPath;
			document.head.append(link);
			styleElement = link;
		}
	} catch (error) {
		console.warn(`Could not check or load stylesheet for view: ${cssPath}`, error);
	}

	try {
		const module = await import(jsPath);
		if (module) {
			const result = await module.render(mainElement, params);
			if (result) {
				if (result.title) document.querySelector("header.titlebar .location")!.innerHTML = result.title;
				if (result.cleanup) cleanup = result.cleanup;
			}
		}
	} catch (error) {
		console.warn(`Could not import script for view: ${jsPath}`, error);
	}
};