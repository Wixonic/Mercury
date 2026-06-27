import html from "./app.html";

import { getIcon } from "/scripts/lib/icon.ts";

import { Guild } from "/scripts/services/discord/guild.ts";

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

	changeState("Fetching guilds", "warning");

	{
		const sidebar = document.querySelector("nav.sidebar")!;
		sidebar.classList.add("loading");

		const createElement = async (guildId: string) => {
			const guildElement = document.createElement("button");
			guildElement.classList.add("guild");

			let guild: Guild<true> | Guild<false> | null = null;
			try {
				guild = await discordClient.guilds.get(guildId) ?? null;
				console.log(guild);
			} catch (error) {
				console.error(error);
			}

			if (guild) {
				const icon = guild.icon ? document.createElement("img") : document.createElement("span");
				icon.classList.add("icon");
				if (guild.icon) (icon as HTMLImageElement).src = guild.icon.getURL(undefined, 256, "high", undefined, undefined, true);
				else (icon as HTMLSpanElement).textContent = guild.name.substring(0, 2).toUpperCase();
				guildElement.append(icon);
			} else guildElement.innerHTML = await getIcon("question-circle");

			const label = document.createElement("label");
			label.textContent = guild ? guild.name : "Guild is unreachable";
			guildElement.append(label);

			return guildElement;
		};

		const directMessagesElement = document.querySelector("button#direct-messages")!;
		directMessagesElement.innerHTML = await getIcon("chats-circle");
		const directMessagesLabel = document.createElement("label");
		directMessagesLabel.textContent = "Direct Messages";
		directMessagesElement.append(directMessagesLabel);

		const favoritesElement = document.querySelector("button#favorites")!;
		favoritesElement.innerHTML = await getIcon("star");
		const favoritesLabel = document.createElement("label");
		favoritesLabel.textContent = "Favorites";
		favoritesElement.append(favoritesLabel);

		const guildContainer = document.querySelector("section.guilds")!;
		guildContainer.classList.add("loading");
		guildContainer.innerHTML = "";
		for (const folder of discordClient.settings!.guild_folders) {
			if (folder.id) {
				for (const guildId of folder.guild_ids) guildContainer.append(await createElement(guildId));
			} else guildContainer.append(await createElement(folder.guild_ids[0]));
		}

		const createGuildElement = document.querySelector("button#create-guild")!;
		createGuildElement.innerHTML = await getIcon("plus-circle");
		const createGuildLabel = document.createElement("label");
		createGuildLabel.textContent = "Create Guild";
		createGuildElement.append(createGuildLabel);

		const exploreGuildsElement = document.querySelector("button#explore-guilds")!;
		exploreGuildsElement.innerHTML = await getIcon("compass");
		const exploreGuildsLabel = document.createElement("label");
		exploreGuildsLabel.textContent = "Explore Guilds";
		exploreGuildsElement.append(exploreGuildsLabel);

		sidebar.classList.remove("loading");
	};

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