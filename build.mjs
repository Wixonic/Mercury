import esbuild from "esbuild";
import { createServer } from "http";
import { readFileSync, cpSync, mkdirSync, readdirSync, statSync } from "fs";
import { join, resolve, extname } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const srcDir = resolve(__dirname, "src");
const distDir = resolve(__dirname, "dist");

const absoluteImportPlugin = {
	name: "absolute-import-resolver",
	setup(build) {
		build.onResolve({ filter: /^\/scripts\// }, (args) => {
			let absPath = resolve(srcDir, args.path.slice(1));
			if (absPath.endsWith(".js")) {
				const tsPath = absPath.replace(/\.js$/, ".ts");
				try {
					statSync(tsPath);
					absPath = tsPath;
				} catch { }
			}
			return { path: absPath };
		});
	},
};

const viewsDir = resolve(srcDir, "scripts", "views");
const viewEntryPoints = [];

for (const name of readdirSync(viewsDir)) {
	const entry = join(viewsDir, name, "index.ts");
	try {
		statSync(entry);
		viewEntryPoints.push({ in: entry, out: `views/${name}/index` });
	} catch { }
}

const sharedOptions = {
	bundle: true,
	platform: "browser",
	target: "es2020",
	format: "esm",
	external: [
		"@tauri-apps/api",
		"@tauri-apps/plugin-http",
		"@tauri-apps/plugin-opener",
		"@tauri-apps/plugin-websocket",
	],
	plugins: [absoluteImportPlugin],
};

async function build() {
	mkdirSync(distDir, { recursive: true });

	cpSync(resolve(srcDir, "index.html"), resolve(distDir, "index.html"));
	cpSync(resolve(srcDir, "main.css"), resolve(distDir, "main.css"));

	for (const folder of ["styles", "assets"]) {
		const src = resolve(srcDir, folder);
		try {
			statSync(src);
			cpSync(src, resolve(distDir, folder), { recursive: true });
		} catch { }
	}

	for (const name of readdirSync(viewsDir)) {
		const htmlSrc = join(viewsDir, name, "index.html");
		const htmlDst = resolve(distDir, "views", name, "index.html");
		try {
			statSync(htmlSrc);
			mkdirSync(resolve(distDir, "views", name), { recursive: true });
			cpSync(htmlSrc, htmlDst);
		} catch { }

		const assetsSrc = join(viewsDir, name, "assets");
		try {
			statSync(assetsSrc);
			cpSync(assetsSrc, resolve(distDir, "views", name, "assets"), { recursive: true });
		} catch { }
	}

	await esbuild.build({
		...sharedOptions,
		entryPoints: [{ in: resolve(srcDir, "main.ts"), out: "main" }],
		outdir: distDir,
	});

	if (viewEntryPoints.length > 0) {
		await esbuild.build({
			...sharedOptions,
			entryPoints: viewEntryPoints,
			outdir: distDir,
		});
	}

	console.log("✓ Build complete →", distDir);
}

async function serve() {
	await build();

	const mimeTypes = {
		".html": "text/html; charset=utf-8",
		".js": "application/javascript; charset=utf-8",
		".css": "text/css; charset=utf-8",
		".png": "image/png",
		".jpg": "image/jpeg",
		".svg": "image/svg+xml",
		".ico": "image/x-icon",
		".json": "application/json",
		".woff2": "font/woff2",
		".woff": "font/woff",
		".ttf": "font/ttf",
	};

	const server = createServer((req, res) => {
		let filePath = resolve(distDir, (req.url ?? "/").replace(/^\//, ""));

		try {
			if (statSync(filePath).isDirectory()) filePath = join(filePath, "index.html");
		} catch { }

		try {
			const content = readFileSync(filePath);
			const mime = mimeTypes[extname(filePath)] ?? "application/octet-stream";
			res.writeHead(200, { "Content-Type": mime });
			res.end(content);
		} catch {
			res.writeHead(404);
			res.end("Not found");
		}
	});

	const port = 1420;
	server.listen(port, "127.0.0.1", () => {
		console.log(`✓ Dev server running → http://localhost:${port}`);
	});
}

const mode = process.argv[2];
if (mode === "--serve") serve();
else build();