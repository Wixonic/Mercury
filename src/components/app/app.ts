import { store } from "/scripts/store/store.ts";
import html from "./app.html";

import { discordClient } from "/main.ts";

let currentState: string | undefined;
const changeState = (state?: string, color: string = "text", force: boolean = false) => {
	const stateElement = document.querySelector("header.titlebar aside.state");
	if (!stateElement) return;
	if (state) stateElement.innerHTML = `<span style="color: hsla(var(--${color}));">${state}...</span>`;
	else if (currentState === undefined || force) stateElement.innerHTML = `<span style="color: hsla(var(--${color}), 50%);">Connected - ${discordClient.ping} ms</span>`;

	currentState = state;
};

const init = () => {
	const user = store.getState().currentUser;
	if (!user) return;

	console.log(user, discordClient);

	changeState(undefined, undefined, true);
};

export const renderApp = (container: HTMLElement): (() => void) => {
	document.body.setAttribute("state", "app");
	container.innerHTML = html;

	changeState("Connecting", "warning");

	const handleHeartbeat = (_event: Event) => changeState();
	const handleConnecting = (_event: Event) => changeState("Connecting", "warning");
	const handleDisconnected = (_event: Event) => changeState("Disconnected", "error");

	discordClient.addEventListener("heartbeat", handleHeartbeat);
	discordClient.addEventListener("connecting", handleConnecting);
	discordClient.addEventListener("disconnected", handleDisconnected);

	const user = store.getState().currentUser;
	let unsubscribe: (() => void) | null = null;
	if (user) {
		init();
	} else {
		unsubscribe = store.subscribe((state) => {
			if (state.currentUser) {
				init();
				if (unsubscribe) {
					unsubscribe();
					unsubscribe = null;
				}
			}
		});
	}

	return () => {
		discordClient.removeEventListener("heartbeat", handleHeartbeat);
		discordClient.removeEventListener("connecting", handleConnecting);
		discordClient.removeEventListener("disconnected", handleDisconnected);
		if (unsubscribe) {
			unsubscribe();
		}
	};
};