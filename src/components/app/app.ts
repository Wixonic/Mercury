import html from "./app.html";

import { discordClient } from "/main.ts";

let currentState: string | undefined;
const changeState = (state?: string, color: string = "text", force: boolean = false) => {
	const stateElement = document.querySelector("header.titlebar aside.state");
	if (!stateElement) return;
	if (state) stateElement.innerHTML = `<span style="color: hsla(var(--${color}));">${state}</span>`;
	else if (currentState === undefined || force && discordClient.ping !== undefined) stateElement.innerHTML = `<span style="color: hsla(var(--${color}), 50%);">Connected - ${discordClient.ping} ms</span>`;

	currentState = state;
};

const ready = async () => {
	changeState("Fetching settings", "warning");
	await discordClient.fetchSettings();

	console.log("Settings:", discordClient.settings);

	changeState("Sending status", "warning");
	await discordClient.send({
		"op": 3,
		"d": {
			"since": null,
			"activities": [],
			"status": "online",
			"afk": false
		}
	});

	changeState(undefined, undefined, true);
};

export const renderApp = (container: HTMLElement): (() => void) => {
	document.body.setAttribute("state", "app");
	container.innerHTML = html;

	changeState("Connecting", "warning");

	const handleHeartbeat = (_event: Event) => changeState();
	const handleConnecting = (_event: Event) => changeState("Connecting", "warning");
	const handleReady = (_event: Event) => ready();
	const handleDisconnected = (_event: Event) => changeState("Disconnected", "error");
	const handleResumed = (_event: Event) => ready();

	discordClient.addEventListener("heartbeat", handleHeartbeat);
	discordClient.addEventListener("connecting", handleConnecting);
	discordClient.addEventListener("ready", handleReady);
	discordClient.addEventListener("disconnected", handleDisconnected);
	discordClient.addEventListener("resumed", handleResumed);

	if (discordClient.ws && discordClient.sessionId) ready();

	return () => {
		discordClient.removeEventListener("heartbeat", handleHeartbeat);
		discordClient.removeEventListener("connecting", handleConnecting);
		discordClient.removeEventListener("ready", handleReady);
		discordClient.removeEventListener("disconnected", handleDisconnected);
		discordClient.removeEventListener("resumed", handleResumed);
	};
};