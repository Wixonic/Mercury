let currentPath = "";
let cleanup: (() => void) | null = null;

export const view = async (path: string) => {
	if (currentPath === path) return;
	currentPath = path;

	cleanup?.();
	cleanup = null;

	const url = new URL(path, location.origin);
	const base = url.pathname.replace("/views/", "/components/app/views/").replace(".html", "");

	const html = await fetch(base + ".html").then((response) => response.text());
	const module = await import(base + ".js").catch(() => null);

	document.querySelector("link[data-view]")?.remove();
	const link = Object.assign(document.createElement("link"), { rel: "stylesheet", href: base + ".css" });
	link.setAttribute("data-view", "true");
	document.head.append(link);

	const main = document.querySelector("main")!;
	main.innerHTML = html;

	if (module?.render) {
		const response = await module.render(main, url.searchParams);

		if (response?.title) {
			const title = document.querySelector("header.titlebar .location")!;
			title.innerHTML = response.title;
		}

		cleanup = response?.cleanup || null;
	}
};