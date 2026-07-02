import { getIcon } from "/scripts/lib/icon.ts";

import { ChannelCategory, ChannelType } from "/scripts/services/discord/channel.ts";
import { Snowflake } from "/scripts/services/discord/snowflake.ts";

import { discordClient } from "/main.ts";

export const render = async (container: HTMLElement, params: URLSearchParams) => {
	const guild = await discordClient.guilds.get(params.get("guildId")!);
	if (!guild) {
		container.innerHTML = "Failed to load guild.";

		return {
			cleanup: () => {

			},
			title: "Unknown Guild"
		};
	} else {
		const channels = await guild.listChannels();

		const channelsContainer = container.querySelector(".channels") as HTMLElement;

		const parents: Record<Snowflake, HTMLElement> = {};

		for (const category of channels.filter((channel) => channel.type === ChannelType.GuildCategory)) {
			const categoryElement = document.createElement("div");
			categoryElement.classList.add("category");

			const categoryHeaderElement = document.createElement("div");
			categoryHeaderElement.classList.add("category-header");

			const categoryCollapseIndicator = document.createElement("div");
			categoryCollapseIndicator.classList.add("collapse");
			categoryCollapseIndicator.innerHTML = await getIcon("caret-down");

			const nameElement = document.createElement("div");
			nameElement.classList.add("name");
			nameElement.textContent = category.name ?? "Unknown category";

			const categorySettingsButton = document.createElement("button");
			categorySettingsButton.classList.add("settings");
			categorySettingsButton.innerHTML = await getIcon("gear");
			categorySettingsButton.setAttribute("tooltip", "Configure category");
			categorySettingsButton.addEventListener("click", (event) => {
				event.stopPropagation();
			});

			const categoryCreateChannelButton = document.createElement("button");
			categoryCreateChannelButton.classList.add("create-channel");
			categoryCreateChannelButton.innerHTML = await getIcon("plus");
			categoryCreateChannelButton.setAttribute("tooltip", "Create channel");
			categoryCreateChannelButton.addEventListener("click", (event) => {
				event.stopPropagation();
			});

			categoryHeaderElement.append(categoryCollapseIndicator, nameElement, categorySettingsButton, categoryCreateChannelButton);

			const categoryContainerElement = document.createElement("div");
			categoryContainerElement.classList.add("category-container");

			const categoryChannelsElement = document.createElement("div");
			categoryChannelsElement.classList.add("category-channels");
			categoryContainerElement.append(categoryChannelsElement);

			categoryHeaderElement.addEventListener("click", (event) => {
				event.stopPropagation();
				categoryHeaderElement.classList.toggle("collapsed");
				categoryContainerElement.classList.toggle("collapsed");
			});

			categoryElement.append(categoryHeaderElement, categoryContainerElement);

			parents[category.id] = categoryChannelsElement;

			channelsContainer.append(categoryElement);
		}

		for (const channel of channels.filter((channel) => channel.type !== ChannelType.GuildCategory)) {
			const channelElement = document.createElement("div");
			channelElement.classList.add("channel");

			const nameElement = document.createElement("div");
			nameElement.classList.add("name");
			nameElement.textContent = channel.name ?? "Unknown channel";

			const channelSettingsButton = document.createElement("button");
			channelSettingsButton.classList.add("settings");
			channelSettingsButton.innerHTML = await getIcon("gear");
			channelSettingsButton.setAttribute("tooltip", "Configure");
			channelSettingsButton.addEventListener("click", (event) => {
				event.stopPropagation();
			});

			channelElement.addEventListener("click", (event) => {
				event.stopPropagation();
			});

			if (channel.category === ChannelCategory.Voice) {
				channelElement.classList.add("voice");

				const channelOpenChatButton = document.createElement("button");
				channelOpenChatButton.classList.add("open-chat");
				channelOpenChatButton.innerHTML = await getIcon("chat-text");
				channelOpenChatButton.setAttribute("tooltip", "Open chat");
				channelOpenChatButton.addEventListener("click", (event) => {
					event.stopPropagation();
				});

				channelElement.append(nameElement, channelOpenChatButton, channelSettingsButton);
			} else channelElement.append(nameElement, channelSettingsButton);

			parents[channel.id] = channelElement;

			if (channel.parent_id && parents[channel.parent_id]) parents[channel.parent_id].append(channelElement);
			else channelsContainer.append(channelElement);
		}

		channelsContainer.classList.remove("loading");

		return {
			cleanup: () => {

			},
			title: guild.name
		};
	}
};