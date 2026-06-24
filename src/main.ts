import { DiscordClient } from "/scripts/services/discord.ts";
import { store } from "/scripts/store/store.ts";
import { renderLogin } from "/components/login/login.ts";
import { renderApp } from "/components/app/app.ts";

export const discordClient = new DiscordClient(new URL("https://discord.com/api/v9"));

const main = () => {
	const appContainer = document.querySelector("main");
	if (!appContainer) {
		console.error("Mount point <main> not found");
		return;
	}

	let currentCleanup: (() => void) | null = null;
	let currentToken: string | null = null;

	store.subscribe((state) => {
		if (state.token && state.token !== currentToken) {
			currentToken = state.token;
			discordClient.init(state.token);
			store.setState({ route: "app" });
		}
	});

	store.subscribe((state) => {
		if (currentCleanup) {
			try {
				currentCleanup();
			} catch (error) {
				console.error("Error cleaning up previous view:", error);
			}
			currentCleanup = null;
		}

		if (state.route === "login") currentCleanup = renderLogin(appContainer);
		else if (state.route === "app") currentCleanup = renderApp(appContainer);
	});
};

addEventListener("DOMContentLoaded", main);