import html from "./app.html";

import { getIcon } from "/scripts/lib/icon.ts";

import { Guild } from "/scripts/services/discord/guild.ts";

import { animateIcon, AnimatedIconElement } from "/components/app/lib/animated-icon.ts";
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
	console.log("Settings:", settings);
	console.log("Self:", self);
	if (currentLoadToken !== loadToken) return;

	const youBar = document.querySelector("nav.you-bar") as HTMLElement;
	{
		youBar.classList.add("loading");

		const avatarContainer = youBar.querySelector("div.avatar")!;
		{
			const avatarImagePlaceholder = avatarContainer.querySelector(".avatar-image") as HTMLElement;
			const avatarImage = animateIcon(self!.avatar.getURL(undefined, 256, "high", undefined, undefined, false), self!.avatar.getURL(undefined, 256, "high", undefined, undefined, true));
			avatarImage.classList.add("avatar-image");
			avatarImagePlaceholder.replaceWith(avatarImage);

			const avatarDecorationPlaceholder = avatarContainer.querySelector(".avatar-decoration") as HTMLElement;
			if (self!.avatar_decoration_data) {
				const avatarDecoration = animateIcon(self!.avatar_decoration_data.asset.getURL(undefined, 256, "high", undefined, undefined, false), self!.avatar_decoration_data.asset.getURL(undefined, 256, "high", undefined, undefined, true));
				avatarDecoration.classList.add("avatar-decoration");
				avatarDecorationPlaceholder.replaceWith(avatarDecoration);
			} else avatarDecorationPlaceholder.classList.add("hidden");

			// const statusIndicator = avatarContainer.querySelector("div.status-indicator");
			// statusIndicator.classList.add();
		}

		const stateElement = youBar.querySelector("div.state")!;
		{
			const nameElement = stateElement.querySelector("div.name")!;
			nameElement.textContent = self!.display_name;
		}

		const nameplate = youBar.querySelector(".nameplate") as HTMLElement;
		if (self!.collectibles?.nameplate?.asset) {
			const animatedNameplate = animateIcon(`https://cdn.discordapp.com/media/v1/collectibles-shop/${self!.collectibles.nameplate.sku_id}/static`, `https://cdn.discordapp.com/media/v1/collectibles-shop/${self!.collectibles.nameplate.sku_id}/animated`);
			animatedNameplate.classList.add("nameplate");
			animatedNameplate.style.setProperty("--palette", `var(--palette-${self!.collectibles.nameplate.palette})`);
			nameplate.replaceWith(animatedNameplate);
		} else nameplate.classList.add("hidden");

		const settingsButton = youBar.querySelector("button#settings")!;
		const settingsIcon = await getIcon("gear-six");
		settingsButton.innerHTML = settingsIcon;

		youBar.addEventListener("mouseenter", () => {
			const animatedIcons = youBar.querySelectorAll(".icon.animated") as NodeListOf<AnimatedIconElement>;
			animatedIcons.forEach((icon) => {
				if (typeof icon.play === "function") icon.play();
			});
		});

		youBar.addEventListener("mouseleave", () => {
			const animatedIcons = youBar.querySelectorAll(".icon.animated") as NodeListOf<AnimatedIconElement>;
			animatedIcons.forEach((icon) => {
				if (typeof icon.stop === "function") icon.stop();
			});
		});

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
			const icon = guild.icon ? animateIcon(guild.icon.getURL(undefined, 256, "high", undefined, undefined, false), guild.icon.getURL(undefined, 256, "high", undefined, undefined, true), guildElement) : document.createElement("span");

			if (!guild.icon) {
				icon.classList.add("icon");
				(icon as HTMLSpanElement).textContent = guild.name.substring(0, 2).toUpperCase();
			}

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

	const [directMessagesIcon, favoritesIcon, createGuildIcon, exploreGuildsIcon] = await Promise.all([
		getIcon("chats-circle"),
		getIcon("star"),
		getIcon("plus-circle"),
		getIcon("compass")
	]);

	directMessagesElement.innerHTML = directMessagesIcon;
	favoritesElement.innerHTML = favoritesIcon;
	createGuildElement.innerHTML = createGuildIcon;
	exploreGuildsElement.innerHTML = exploreGuildsIcon;

	const guildContainer = sidebar.querySelector("section.guilds")!;
	guildContainer.innerHTML = "";
	const guildIds: Snowflake[] = [];
	for (const folder of settings.guildFolders!.folders) {
		for (const guildId of folder.guildIds) guildIds.push(guildId);
	}

	const guildElementsList = await Promise.all(guildIds.map((id) => createElement(id)));

	const guildElementMap = new Map<Snowflake, HTMLElement>();
	guildIds.forEach((id, index) => guildElementMap.set(id, guildElementsList[index]));

	for (const folder of settings.guildFolders!.folders) {
		if (folder.id) {
			const folderElement = document.createElement("div");
			folderElement.classList.add("folder");

			for (const guildId of folder.guildIds) {
				const guildElement = guildElementMap.get(guildId);
				if (guildElement) folderElement.append(guildElement);
			}

			guildContainer.append(folderElement);
		} else {
			const guildElement = guildElementMap.get(folder.guildIds[0]);
			if (guildElement) guildContainer.append(guildElement);
		}
	}

	sidebar.classList.remove("loading");

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