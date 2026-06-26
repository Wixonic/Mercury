import esbuild from "esbuild";
import { createServer } from "http";
import { readFileSync, cpSync, mkdirSync, readdirSync, statSync, rmSync } from "fs";
import { join, resolve, extname } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const srcDir = resolve(__dirname, "src");
const distDir = resolve(__dirname, "dist");

const absoluteImportPlugin = {
	name: "absolute-import-resolver",
	setup(build) {
		build.onResolve({ filter: /^\// }, (args) => {
			if (args.path.startsWith("/assets/")) return { path: args.path, external: true };
			if (args.path.startsWith(srcDir)) return;

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

async function build() {
	rmSync(distDir, { recursive: true, force: true });
	mkdirSync(distDir, { recursive: true });

	cpSync(resolve(srcDir, "index.html"), resolve(distDir, "index.html"));

	for (const folder of ["styles", "assets"]) {
		const src = resolve(srcDir, folder);
		try {
			statSync(src);
			cpSync(src, resolve(distDir, folder), { recursive: true });
		} catch { }
	}

	await esbuild.build({
		...sharedOptions,
		entryPoints: [
			{ in: resolve(srcDir, "main.ts"), out: "main" },
			{ in: resolve(srcDir, "main.css"), out: "main" }
		],
		outdir: distDir,
	});

	console.log("✓ Build complete →", distDir);
}

async function serve() {
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

		if (pathname === "/captcha-solve") {
			const sitekey = url.searchParams.get("sitekey") || "";
			const rqdata = url.searchParams.get("rqdata") || "";

			let html = "";
			try {
				html = readFileSync(resolve(srcDir, "components/captcha.html"), "utf-8");
				html = html.replace("{{SITEKEY}}", sitekey);
				html = html.replace("{{RQDATA}}", rqdata ? `rqdata: "${rqdata.replace(/"/g, '\\"')}",` : "");
			} catch (error) {
				html = "Error loading captcha page template.";
				console.error("Missing components/captcha.html:", error);
			}

			res.writeHead(200, {
				"Content-Type": "text/html; charset=utf-8",
				"Access-Control-Allow-Origin": "*",
				"Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
				"Pragma": "no-cache",
				"Expires": "0"
			});
			res.end(html);
			return;
		}

		if (pathname === "/captcha-token") {
			const token = url.searchParams.get("token");
			const ua = url.searchParams.get("ua");
			if (token) {
				pendingCaptchaToken = { token, ua };
				console.log("✓ Captcha token received with UA:", ua);
			}

			res.writeHead(200, {
				"Content-Type": "text/plain",
				"Access-Control-Allow-Origin": "*"
			});
			res.end("ok");
			return;
		}

		if (pathname === "/captcha-poll") {
			const data = pendingCaptchaToken;
			pendingCaptchaToken = null;
			res.writeHead(200, {
				"Content-Type": "application/json",
				"Access-Control-Allow-Origin": "*"
			});
			res.end(JSON.stringify(data || { token: null }));
			return;
		}

		let filePath = resolve(distDir, pathname.replace(/^\//, ""));

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