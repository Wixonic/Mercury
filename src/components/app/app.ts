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

	const createGuildElement = async (guildId: string) => {
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
			if (guild.icon) (icon as HTMLImageElement).src = guild.icon.getURL(undefined, 256, "high");
			else (icon as HTMLSpanElement).textContent = guild.name.substring(0, 2).toUpperCase();
			guildElement.append(icon);
		} else {
			const icon = document.createElement("svg");
			icon.classList.add("icon");
			icon.innerHTML = await getIcon("question-circle");
			guildElement.append(icon);
		}

		const label = document.createElement("label");
		label.textContent = guild ? guild.name : "Guild is unreachable";
		guildElement.append(label);

		return guildElement;
	};

	const guildContainer = document.querySelector("section.guilds")!;
	guildContainer.innerHTML = "";
	for (const folder of discordClient.settings!.guild_folders) {
		if (folder.id) {
			for (const guildId of folder.guild_ids) guildContainer.append(await createGuildElement(guildId));
		} else guildContainer.append(await createGuildElement(folder.guild_ids[0]));
	}


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