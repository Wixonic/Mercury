import QRCode from "qr-code-styling";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

import { discordClient } from "/main.ts";
import { store } from "/scripts/store/store.ts";

import html from "./login.html";
import icon from "../../../src-tauri/icons/icon.svg";

export const renderLogin = (container: HTMLElement): (() => void) => {
	document.body.setAttribute("state", "login");
	container.innerHTML = html;

	const QRContainer = container.querySelector(".qrcontainer");
	if (!QRContainer) throw new Error("QR container not found");


	const refresh = () => {
		blurQR();
		discordClient.remoteAuth.cleanup();
		discordClient.remoteAuth.init();
	};

	const blurQR = () => {
		QRContainer.classList.add("blur");
	};

	const drawQRCode = async (url: string) => {
		QRContainer.classList.remove("blur");
		QRContainer.innerHTML = "";

		const qr = new QRCode({
			data: url,
			qrOptions: {
				errorCorrectionLevel: "H"
			},
			image: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
			imageOptions: {
				imageSize: 0.3,
				margin: 4
			},
			type: "svg",
			width: 512 * devicePixelRatio,
			height: 512 * devicePixelRatio,
			dotsOptions: {
				color: "currentColor",
				type: "rounded"
			},
			backgroundOptions: {
				color: "#000"
			}
		});

		const svg = (await qr.getRawData("svg")) as Blob;
		const svgHTML = await svg.text();
		const svgElement = new DOMParser().parseFromString(svgHTML, "image/svg+xml").documentElement;

		const imageElement = svgElement.querySelector("image");
		if (!imageElement) throw new Error("QR code image element not found");

		const parser = new DOMParser();
		const iconElement = parser.parseFromString(icon, "image/svg+xml").documentElement;

		iconElement.setAttribute("x", imageElement.getAttribute("x")!);
		iconElement.setAttribute("y", imageElement.getAttribute("y")!);
		iconElement.setAttribute("width", imageElement.getAttribute("width")!);
		iconElement.setAttribute("height", imageElement.getAttribute("height")!);

		imageElement.replaceWith(iconElement);

		QRContainer.appendChild(svgElement);
	};

	const handleQR = async (event: Event) => {
		const url = (event as CustomEvent<string>).detail;
		await drawQRCode(url);
	};

	const handleUserDetected = (_event: Event) => {
		blurQR();
		// const user = (event as CustomEvent<any>).detail;
	};

	const handleToken = async (event: Event) => {
		blurQR();
		const token = (event as CustomEvent<string>).detail;
		console.log("Token received successfully");
		store.setState({ token });
	};

	const handleCancel = () => {
		console.warn("Authentication cancelled by user.");
		refresh();
	};

	const handleError = (error: Event) => {
		const detail = (error as CustomEvent<any>).detail;
		console.error("Remote auth error:", detail);
		refresh();
	};

	const handleCaptchaRequired = async (event: Event) => {
		const { sitekey, rqdata, rqtoken, sessionId, ticket } = (event as CustomEvent<any>).detail;
		console.log("Captcha required, opening native window...");

		let cleanedUp = false;
		let unlistenSuccess: (() => void) | null = null;
		let unlistenDestroyed: (() => void) | null = null;

		const cleanup = () => {
			if (cleanedUp) return;
			cleanedUp = true;
			if (unlistenSuccess) unlistenSuccess();
			if (unlistenDestroyed) unlistenDestroyed();
		};

		// 1. Listen for the success event
		const successPromise = listen<{ token: string }>("hcaptcha-success", async (evt) => {
			cleanup();
			const encryptedToken = evt.payload.token;
			console.log("hCaptcha solved and login completed successfully!");

			// Close the captcha window
			try {
				const captchaWindow = await WebviewWindow.getByLabel("captcha-window");
				if (captchaWindow) {
					await captchaWindow.close();
				}
			} catch (err) {
				console.error("Failed to close captcha window:", err);
			}

			await discordClient.remoteAuth.completeManualTokenDecrypt(encryptedToken);
		});

		// 2. Open the captcha window
		try {
			await invoke("open_captcha_window", {
				sitekey,
				rqdata: rqdata || null,
				rqtoken: rqtoken || null,
				sessionId: sessionId || null,
				ticket,
				appOrigin: window.location.origin
			});

			// 3. Listen to window destruction to handle cancellation
			const captchaWindow = await WebviewWindow.getByLabel("captcha-window");
			if (captchaWindow) {
				const destroyedPromise = captchaWindow.once("tauri://destroyed", () => {
					if (!cleanedUp) {
						console.warn("Captcha window closed without completion.");
						cleanup();
						refresh();
					}
				});
				unlistenDestroyed = await destroyedPromise;
			}
		} catch (error) {
			console.error("Failed to open captcha window:", error);
			cleanup();
			refresh();
		}

		unlistenSuccess = await successPromise;
	};

	discordClient.remoteAuth.addEventListener("qr", handleQR);
	discordClient.remoteAuth.addEventListener("user_detected", handleUserDetected);
	discordClient.remoteAuth.addEventListener("token", handleToken);
	discordClient.remoteAuth.addEventListener("cancel", handleCancel);
	discordClient.remoteAuth.addEventListener("error", handleError);
	discordClient.remoteAuth.addEventListener("captcha_required", handleCaptchaRequired);

	const form = container.querySelector("form");
	if (form) {
		form.onsubmit = (event) => {
			event.preventDefault();
		};
	}

	const tokenInput = container.querySelector("#token") as HTMLInputElement;
	if (tokenInput) {
		tokenInput.addEventListener("keydown", async (event) => {
			if (event.key === "Enter") {
				event.preventDefault();
				const token = tokenInput.value.trim();
				if (token) {
					console.log("Token entered manually, transitioning route...");
					store.setState({ token });
				}
			}
		});
	}

	discordClient.remoteAuth.init();

	return () => {
		discordClient.remoteAuth.removeEventListener("qr", handleQR);
		discordClient.remoteAuth.removeEventListener("user_detected", handleUserDetected);
		discordClient.remoteAuth.removeEventListener("token", handleToken);
		discordClient.remoteAuth.removeEventListener("cancel", handleCancel);
		discordClient.remoteAuth.removeEventListener("error", handleError);
		discordClient.remoteAuth.removeEventListener("captcha_required", handleCaptchaRequired);
		discordClient.remoteAuth.cleanup();
	};
};