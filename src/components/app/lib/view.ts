let currentStyleElement: HTMLLinkElement | null = null;
let currentCleanup: (() => void) | null = null;

export const view = async (path: string): Promise<void> => {
	let resolvedPath = path;
	if (path.startsWith("/views/")) {
		resolvedPath = `/components/app/views/${path.substring("/views/".length)}`;
	}

	const htmlPath = resolvedPath;
	const baseName = resolvedPath.substring(0, resolvedPath.lastIndexOf("."));
	const cssPath = `${baseName}.css`;
	const jsPath = `${baseName}.js`;

	if (currentCleanup) {
		try {
			currentCleanup();
		} catch (error) {
			console.error("Error cleaning up previous view:", error);
		}
		currentCleanup = null;
	}

	if (currentStyleElement) {
		currentStyleElement.remove();
		currentStyleElement = null;
	}

	const mainElement = document.querySelector("main");
	if (!mainElement) {
		throw new Error("Could not find main element");
	}

	const response = await fetch(htmlPath);
	if (!response.ok) {
		throw new Error(`Failed to fetch HTML for view: ${response.statusText}`);
	}

	mainElement.innerHTML = await response.text();

	try {
		const cssCheck = await fetch(cssPath, { method: "HEAD" });
		if (cssCheck.ok) {
			const link = document.createElement("link");
			link.rel = "stylesheet";
			link.href = cssPath;
			document.head.append(link);
			currentStyleElement = link;
		}
	} catch (error) {
		console.warn(`Could not check or load stylesheet for view: ${cssPath}`, error);
	}

	try {
		const module = await import(jsPath);
		if (module) {
			if (typeof module.default === "function") {
				currentCleanup = module.default(mainElement);
			} else if (typeof module.render === "function") {
				currentCleanup = module.render(mainElement);
			} else if (typeof module.init === "function") {
				currentCleanup = module.init(mainElement);
			}
		}
	} catch (error) {
		console.warn(`Could not import script for view: ${jsPath}`, error);
	}
};
