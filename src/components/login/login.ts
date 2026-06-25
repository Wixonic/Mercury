import QRCode from "qr-code-styling";

import { discordClient } from "/main.ts";
import { store } from "/scripts/store/store.ts";
import { getCSSVariable } from "/scripts/lib/utils.ts";
import icon from "../../../src-tauri/icons/icon.svg";

import html from "./login.html";

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

		const svg: Blob = await qr.getRawData("svg");
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

	discordClient.remoteAuth.addEventListener("qr", handleQR);
	discordClient.remoteAuth.addEventListener("user_detected", handleUserDetected);
	discordClient.remoteAuth.addEventListener("token", handleToken);
	discordClient.remoteAuth.addEventListener("cancel", handleCancel);
	discordClient.remoteAuth.addEventListener("error", handleError);

	discordClient.remoteAuth.init();

	return () => {
		discordClient.remoteAuth.removeEventListener("qr", handleQR);
		discordClient.remoteAuth.removeEventListener("user_detected", handleUserDetected);
		discordClient.remoteAuth.removeEventListener("token", handleToken);
		discordClient.remoteAuth.removeEventListener("cancel", handleCancel);
		discordClient.remoteAuth.removeEventListener("error", handleError);
		discordClient.remoteAuth.cleanup();
	};
};