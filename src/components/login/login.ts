import QRCode from "qr-code-styling";

import { discordClient } from "/main.ts";
import { store } from "/scripts/store/store.ts";
import { getCSSColor } from "/scripts/lib/utils.ts";

import html from "./login.html";

export const renderLogin = (container: HTMLElement): (() => void) => {
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

		const qr = new QRCode({
			data: url,
			type: "svg",
			width: 256 * devicePixelRatio,
			height: 256 * devicePixelRatio,
			dotsOptions: {
				color: getCSSColor("--blurple"),
				type: "rounded"
			},
			backgroundOptions: {
				color: "#FFFFFF"
			},
			imageOptions: {
				margin: 4
			}
		});

		qr.append(QRContainer as HTMLElement);
	};

	const handleQR = async (event: Event) => {
		const url = (event as CustomEvent<string>).detail;
		await drawQRCode(url);
	};

	const handleUserDetected = (event: Event) => {
		blurQR();
		const user = (event as CustomEvent<any>).detail;
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

	const handleClose = () => {
		console.warn("Remote auth connection closed.");
	};

	discordClient.remoteAuth.addEventListener("qr", handleQR);
	discordClient.remoteAuth.addEventListener("user_detected", handleUserDetected);
	discordClient.remoteAuth.addEventListener("token", handleToken);
	discordClient.remoteAuth.addEventListener("cancel", handleCancel);
	discordClient.remoteAuth.addEventListener("error", handleError);
	discordClient.remoteAuth.addEventListener("close", handleClose);

	discordClient.remoteAuth.init();

	return () => {
		discordClient.remoteAuth.removeEventListener("qr", handleQR);
		discordClient.remoteAuth.removeEventListener("user_detected", handleUserDetected);
		discordClient.remoteAuth.removeEventListener("token", handleToken);
		discordClient.remoteAuth.removeEventListener("cancel", handleCancel);
		discordClient.remoteAuth.removeEventListener("error", handleError);
		discordClient.remoteAuth.removeEventListener("close", handleClose);
		discordClient.remoteAuth.cleanup();
	};
};