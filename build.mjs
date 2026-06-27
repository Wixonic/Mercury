import esbuild from "esbuild";
import { createServer } from "http";
import { readFileSync, cpSync, mkdirSync, readdirSync, statSync, rmSync } from "fs";
import { join, resolve, extname } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const source = resolve(__dirname, "src");
const distribution = resolve(__dirname, "dist");

const absoluteImportPlugin = {
	name: "absolute-import-resolver",
	setup(build) {
		build.onResolve({ filter: /^\// }, (args) => {
			if (args.path.startsWith("/assets/")) return { path: args.path, external: true };
			if (args.path.startsWith(source)) return;

			let absolutePath = resolve(source, args.path.slice(1));
			if (absolutePath.endsWith(".js")) {
				const tsPath = absolutePath.replace(/\.js$/, ".ts");
				try {
					statSync(tsPath);
					absolutePath = tsPath;
				} catch { }
			}

			return { path: absolutePath };
		});
	}
};

const sharedOptions = {
	bundle: true,
	platform: "browser",
	target: "es2020",
	format: "esm",
	splitting: true,
	plugins: [absoluteImportPlugin],
	loader: {
		".html": "text",
		".svg": "text",
	},
};

const build = async () => {
	rmSync(distribution, { recursive: true, force: true });
	mkdirSync(distribution, { recursive: true });

	cpSync(resolve(source, "index.html"), resolve(distribution, "index.html"));

	for (const folder of ["styles", "assets"]) {
		const src = resolve(source, folder);
		try {
			statSync(src);
			cpSync(src, resolve(distribution, folder), { recursive: true });
		} catch { }
	}

	await esbuild.build({
		...sharedOptions,
		entryPoints: [
			{ in: resolve(source, "main.ts"), out: "main" },
			{ in: resolve(source, "main.css"), out: "main" }
		],
		outdir: distribution,
	});

	console.log("✓ Build complete →", distribution);
}

const serve = async () => {
	await build();

	let pendingCaptchaToken = null;

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
		const url = new URL(req.url ?? "/", "http://localhost");
		const pathname = url.pathname;
		const relativePath = pathname.replace(/^\//, "");
		let filePath = resolve(distribution, relativePath);

		if (relativePath.startsWith("assets/") || relativePath.startsWith("styles/")) filePath = resolve(source, relativePath);

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
};

const mode = process.argv[2];
if (mode === "--serve") serve();
else build();