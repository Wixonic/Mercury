import { store } from "/scripts/store/store.ts";
import html from "./app.html";

import { discordClient } from "/main.ts";

let currentState: string | undefined;
const changeState = (state?: string, color: string = "text", force: boolean = false) => {
	const stateElement = document.querySelector("header.titlebar aside.state")!;
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

	discordClient.addEventListener("heartbeat", (_event) => changeState());
	discordClient.addEventListener("connecting", (_event) => changeState("Connecting", "warning"));
	discordClient.addEventListener("disconnected", (_event) => changeState("Disconnected", "error"));

	const user = store.getState().currentUser;
	if (user) init();
	else {
		const unsubscribe = store.subscribe((state) => {
			if (state.currentUser) {
				init();
				unsubscribe();
			}
		});
		return unsubscribe;
	}

	return () => { };
};