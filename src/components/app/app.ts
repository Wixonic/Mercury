import html from "./app.html";

import { getIcon } from "/scripts/lib/icon.ts";

import { Guild } from "/scripts/services/discord/guild.ts";

import { view } from "/components/app/lib/view.ts";

import { discordClient } from "/main.ts";
import { Snowflake } from "/scripts/services/discord/snowflake";

let currentState: string | undefined;
const changeState = (state?: string, color: string = "text", force: boolean = false) => {
	const stateElement = document.querySelector("header.titlebar aside.state");
	if (!stateElement) return;
	if (state) stateElement.innerHTML = `<span style="color: hsla(var(--${color}));">${state}</span>`;
	else if (currentState === undefined || force && discordClient.ping !== undefined) stateElement.innerHTML = `<span style="color: hsla(var(--${color}), 50%);">Connected - ${discordClient.ping} ms</span>`;

	currentState = state;
};

let currentLoadToken: object | null = null;

const ready = async () => {
	const loadToken = {};
	currentLoadToken = loadToken;

	changeState("Displaying homepage", "warning");

	await view("/views/homepage/homepage.html");
	if (currentLoadToken !== loadToken) return;

	changeState("Fetching data", "warning");

	const [settings, self] = await Promise.all([
		discordClient.fetchSettings(),
		discordClient.self()
	]);
	if (currentLoadToken !== loadToken) return;
	console.log(settings, self);

	const youBar = document.querySelector("nav.you-bar");
	if (youBar) {
		youBar.classList.add("loading");

		const avatarContainer = youBar.querySelector("div.avatar")!;
		{
			const avatarImage = avatarContainer.querySelector("img.avatar-image") as HTMLImageElement;
			avatarImage.src = self!.avatar.getURL(undefined, 256, "high", undefined, undefined, true);

			if (self!.avatar_decoration_data) {
				const avatarDecoration = avatarContainer.querySelector("img.avatar-decoration") as HTMLImageElement;
				avatarDecoration.src = self!.avatar_decoration_data.asset.getURL(undefined, 256, "high", undefined, undefined, true);
			}

			// const statusIndicator = avatarContainer.querySelector("div.status-indicator");
			// statusIndicator.classList.add();
		}

		const stateElement = youBar.querySelector("div.state")!;
		{
			const nameElement = stateElement.querySelector("div.name")!;
			nameElement.textContent = self!.display_name;
		}


		const settingsButton = youBar.querySelector("button#settings")!;
		const settingsIcon = await getIcon("gear-six");
		settingsButton.innerHTML = settingsIcon;
		settingsButton.setAttribute("tooltip", "Settings");
		settingsButton.setAttribute("tooltip-orientation", "top");

		youBar.classList.remove("loading");
	}

	changeState("Fetching guilds", "warning");

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
		} else {
			const questionIcon = await getIcon("question-circle");
			guildElement.innerHTML = questionIcon;
		}

		guildElement.setAttribute("tooltip", guild ? guild.name : "Guild is unreachable");
		return guildElement;
	};

	const directMessagesElement = sidebar.querySelector("button#direct-messages")!;
	const favoritesElement = sidebar.querySelector("button#favorites")!;
	const createGuildElement = sidebar.querySelector("button#create-guild")!;
	const exploreGuildsElement = sidebar.querySelector("button#explore-guilds")!;

	const [dmIcon, favIcon, createIcon, exploreIcon] = await Promise.all([
		getIcon("chats-circle"),
		getIcon("star"),
		getIcon("plus-circle"),
		getIcon("compass")
	]);

	directMessagesElement.innerHTML = dmIcon;
	directMessagesElement.setAttribute("tooltip", "Direct Messages");

	favoritesElement.innerHTML = favIcon;
	favoritesElement.setAttribute("tooltip", "Favorites");

	const guildContainer = sidebar.querySelector("section.guilds");
	if (guildContainer) {
		guildContainer.innerHTML = "";
		const guildIds: Snowflake[] = [];
		for (const folder of discordClient.settings!.guild_folders) {
			for (const guildId of folder.guild_ids) guildIds.push(guildId);
		}

		const guildElementsList = await Promise.all(guildIds.map((id) => createElement(id)));

		const guildElementMap = new Map<Snowflake, HTMLElement>();
		guildIds.forEach((id, index) => guildElementMap.set(id, guildElementsList[index]));

		for (const folder of discordClient.settings!.guild_folders) {
			if (folder.id) {
				const folderElement = document.createElement("div");
				folderElement.classList.add("folder");

				for (const guildId of folder.guild_ids) {
					const guildElement = guildElementMap.get(guildId);
					if (guildElement) folderElement.append(guildElement);
				}

				guildContainer.append(folderElement);
			} else if (folder.guild_ids.length > 0) {
				const guildElement = guildElementMap.get(folder.guild_ids[0]);
				if (guildElement) guildContainer.append(guildElement);
			}
		}

		createGuildElement.innerHTML = createIcon;
		createGuildElement.setAttribute("tooltip", "Create Guild");

		exploreGuildsElement.innerHTML = exploreIcon;
		exploreGuildsElement.setAttribute("tooltip", "Explore Guilds");

		sidebar.classList.remove("loading");
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