import html from "./app.html";

import JSONPackage from "/../package.json" with { type: "json" };

import { getIcon } from "/scripts/lib/icon.ts";

import { GatewayEvent, GatewayDispatchEvent } from "/scripts/services/discord/gateway.ts";
import { Guild } from "/scripts/services/discord/guild.ts";
import { Snowflake } from "/scripts/services/discord/snowflake.ts";

import { animateIcon, AnimatedIconElement } from "/components/app/lib/animated-icon.ts";
import { view } from "/components/app/lib/view.ts";

import { discordClient } from "/main.ts";

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
	changeState("Loading icons", "warning");

	const [settingsIcon, warningIcon, directMessagesIcon, favoritesIcon, createGuildIcon, exploreGuildsIcon] = await Promise.all([
		getIcon("gear"),
		getIcon("warning-circle"),
		getIcon("chats"),
		getIcon("star"),
		getIcon("plus-circle"),
		getIcon("compass")
	]);

	const loadToken = {};
	currentLoadToken = loadToken;

	changeState("Displaying homepage", "warning");

	await view("/views/homepage/homepage.html");
	if (currentLoadToken !== loadToken) return;

	changeState("Fetching user", "warning");

	const self = await discordClient.self();
	if (currentLoadToken !== loadToken) return;

	const youBar = document.querySelector("nav.you-bar") as HTMLElement;
	{
		youBar.classList.add("loading");

		const avatarContainer = youBar.querySelector("div.avatar")!;
		const avatarImageSVG = avatarContainer.querySelector("svg.avatar-image")!;
		const avatarImage = avatarImageSVG.querySelector("image")!;
		const staticAvatarUrl = self!.avatar.getURL(undefined, 256, "high", undefined, false, false);
		const animatedAvatarUrl = self!.avatar.getURL(undefined, 256, "high", undefined, undefined, true);
		avatarImage.setAttribute("href", staticAvatarUrl);

		const avatarDecorationSVG = avatarContainer.querySelector("svg.avatar-decoration")!;
		const avatarDecoration = avatarDecorationSVG.querySelector("image")!;
		let staticDecorationUrl: string | undefined;
		let animatedDecorationUrl: string | undefined;

		if (self!.avatar_decoration_data) {
			staticDecorationUrl = self!.avatar_decoration_data.asset.getURL("png", 256, "high", undefined, false, false);
			animatedDecorationUrl = self!.avatar_decoration_data.asset.getURL("png", 256, "high", undefined, undefined, true);
			avatarDecoration.setAttribute("href", staticDecorationUrl);
			avatarDecorationSVG.classList.remove("hidden");
		} else {
			avatarDecorationSVG.classList.add("hidden");
		}

		const statusIconSVG = avatarContainer.querySelector("svg.status-icon")!;
		statusIconSVG.classList.add("online");

		const stateElement = youBar.querySelector("div.state")!;
		{
			const nameElement = stateElement.querySelector("div.name")!;
			if (self!.display_name_styles) {
				const { font_id, effect_id, colors } = self!.display_name_styles;
				nameElement.innerHTML = `
					<div class="discord-name-style-container">
						<div class="discord-name-style-inner discord-name-style-font-${font_id} discord-name-style-effect-${effect_id}"
							 style="--discord-name-style-color-1: ${colors[0]?.hex ?? 'inherit'}; --discord-name-style-color-2: ${colors[1]?.hex ?? 'inherit'};"
							 data-username="${self!.display_name}">
							${self!.display_name}
						</div>
					</div>
				`;
			} else {
				nameElement.textContent = self!.display_name;
			}
		}

		const nameplate = youBar.querySelector(".nameplate") as HTMLElement;
		if (self!.collectibles?.nameplate?.asset) {
			const animatedNameplate = animateIcon(`https://cdn.discordapp.com/media/v1/collectibles-shop/${self!.collectibles.nameplate.sku_id}/static`, `https://cdn.discordapp.com/media/v1/collectibles-shop/${self!.collectibles.nameplate.sku_id}/animated`);
			animatedNameplate.classList.add("nameplate");
			animatedNameplate.style.setProperty("--palette", `var(--discord-nameplate-${self!.collectibles.nameplate.palette}-dark)`);
			nameplate.replaceWith(animatedNameplate);
		} else nameplate.classList.add("hidden");

		const settingsButton = youBar.querySelector("button#settings")!;
		settingsButton.innerHTML = settingsIcon;

		youBar.addEventListener("mouseenter", () => {
			youBar.classList.add("animated");
			const animatedIcons = youBar.querySelectorAll(".icon.animated") as NodeListOf<AnimatedIconElement>;
			animatedIcons.forEach((icon) => {
				if (typeof icon.play === "function") icon.play();
			});
			avatarImage.setAttribute("href", animatedAvatarUrl);
			if (animatedDecorationUrl) avatarDecoration.setAttribute("href", animatedDecorationUrl);
		});

		youBar.addEventListener("mouseleave", () => {
			youBar.classList.remove("animated");
			const animatedIcons = youBar.querySelectorAll(".icon.animated") as NodeListOf<AnimatedIconElement>;
			animatedIcons.forEach((icon) => {
				if (typeof icon.stop === "function") icon.stop();
			});
			avatarImage.setAttribute("href", staticAvatarUrl);
			if (staticDecorationUrl) avatarDecoration.setAttribute("href", staticDecorationUrl);
		});

		youBar.classList.remove("loading");
	}

	changeState("Fetching guilds", "warning");

	if (!discordClient.settings) {
		try {
			await discordClient.fetchSettings();
		} catch (error) {
			console.error("Failed to fetch settings:", error);
		}
	}

	const sidebar = document.querySelector("nav.sidebar")!;
	sidebar.classList.add("loading");

	const createElement = async (guildId: string) => {
		const guildElement = document.createElement("button");
		guildElement.classList.add("guild");

		let guild: Guild<false> | Guild<true> | null = null;
		try {
			guild = await discordClient.guilds.get(guildId) ?? null;
		} catch (error) {
			console.error("Error fetching guild:", error);
		}

		if (guild) {
			const icon = guild.icon ? animateIcon(guild.icon.getURL(undefined, 256, "high", undefined, undefined, false), guild.icon.getURL(undefined, 256, "high", undefined, undefined, true), guildElement) : document.createElement("span");

			if (!guild.icon) {
				icon.classList.add("icon");
				(icon as HTMLSpanElement).textContent = guild.name.substring(0, 2).toUpperCase();
			}

			guildElement.append(icon);

			guildElement.addEventListener("click", async () => {
				await view(`/views/guild/guild.html?guildId=${guildId}`);
			});
		} else guildElement.innerHTML = warningIcon;

		guildElement.setAttribute("tooltip", guild ? guild.name : "Guild is unreachable");
		return guildElement;
	};

	const directMessagesElement = sidebar.querySelector("button#direct-messages")!;
	const favoritesElement = sidebar.querySelector("button#favorites")!;
	const createGuildElement = sidebar.querySelector("button#create-guild")!;
	const exploreGuildsElement = sidebar.querySelector("button#explore-guilds")!;

	directMessagesElement.innerHTML = directMessagesIcon;
	favoritesElement.innerHTML = favoritesIcon;
	createGuildElement.innerHTML = createGuildIcon;
	exploreGuildsElement.innerHTML = exploreGuildsIcon;

	directMessagesElement.addEventListener("click", async () => {
		await view("/views/direct-messages/direct-messages.html");
	});

	favoritesElement.addEventListener("click", async () => {
		await view("/views/favorites/favorites.html");
	});

	const guildContainer = sidebar.querySelector("section.guilds")!;
	guildContainer.innerHTML = "";
	const guildIds: Snowflake[] = [];
	if (discordClient.settings?.guildFolders?.folders) {
		for (const folder of discordClient.settings.guildFolders.folders) {
			for (const guildId of folder.guildIds) guildIds.push(guildId.toString());
		}
	}

	const guildElementsList = await Promise.all(guildIds.map((id) => createElement(id)));

	const guildElementMap = new Map<Snowflake, HTMLElement>();
	guildIds.forEach((id, index) => guildElementMap.set(id, guildElementsList[index]));

	if (discordClient.settings?.guildFolders?.folders) {
		const caretIcon = await getIcon("caret-down");

		for (const folder of discordClient.settings.guildFolders.folders) {
			if (folder.id?.value !== undefined) {
				const folderElement = document.createElement("div");
				folderElement.classList.add("folder", "collapsed");

				if (folder.color !== undefined) folderElement.style.setProperty("--folder-color", `#${Number(folder.color).toString(16).padStart(6, "0")}`);

				const folderHeader = document.createElement("button");
				folderHeader.classList.add("folder-header");
				folderHeader.addEventListener("click", () => folderElement.classList.toggle("collapsed"));

				const folderIcon = document.createElement("div");
				folderIcon.classList.add("folder-icon");
				folderHeader.append(folderIcon);

				const caretSpan = document.createElement("span");
				caretSpan.classList.add("caret");
				caretSpan.innerHTML = caretIcon;
				folderHeader.append(caretSpan);

				folderElement.append(folderHeader);

				const folderContent = document.createElement("div");
				folderContent.classList.add("folder-content");
				folderElement.append(folderContent);

				for (const guildId of folder.guildIds) {
					const guildElement = guildElementMap.get(guildId.toString());
					if (guildElement) {
						folderContent.append(guildElement);
						if (folderIcon.children.length < 4) {
							const miniIcon = guildElement.cloneNode(true) as HTMLElement;
							miniIcon.classList.add("mini-icon");
							miniIcon.removeAttribute("tooltip");
							folderIcon.append(miniIcon);
						}
					}
				}

				guildContainer.append(folderElement);
			} else {
				const guildElement = guildElementMap.get(folder.guildIds[0]?.toString() ?? "");
				if (guildElement) guildContainer.append(guildElement);
			}
		}
	}

	createGuildElement.addEventListener("click", async () => {
		await view("/views/create-guild/create-guild.html");
	});

	exploreGuildsElement.addEventListener("click", async () => {
		await view("/views/explore-guilds/explore-guilds.html");
	});

	sidebar.classList.remove("loading");

	changeState("Sending status", "warning");

	await discordClient.send({
		"op": 3,
		"d": {
			status: "idle",
			since: null,
			activities: [{
				name: `Mercury v${JSONPackage.version}`,
				details: "A lightweight, fast, privacy-first, and powerful Discord client.",
				details_url: "https://github.com/Wixonic/Mercury",
				type: 0
			}],
			afk: false
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

	discordClient.addEventListener(GatewayEvent.Heartbeat, handleHeartbeat);
	discordClient.addEventListener(GatewayEvent.Connecting, handleConnecting);
	discordClient.addEventListener(GatewayDispatchEvent.Ready, handleReady);
	discordClient.addEventListener(GatewayEvent.Disconnected, handleDisconnected);
	discordClient.addEventListener(GatewayDispatchEvent.Resumed, handleResumed);

	if (discordClient.ws && discordClient.sessionId) ready();

	return () => {
		discordClient.removeEventListener(GatewayEvent.Heartbeat, handleHeartbeat);
		discordClient.removeEventListener(GatewayEvent.Connecting, handleConnecting);
		discordClient.removeEventListener(GatewayDispatchEvent.Ready, handleReady);
		discordClient.removeEventListener(GatewayEvent.Disconnected, handleDisconnected);
		discordClient.removeEventListener(GatewayDispatchEvent.Resumed, handleResumed);
	};
};