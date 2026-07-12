import { getIcon } from "/scripts/lib/icon.ts";

import { ChannelCategory, ChannelType } from "/scripts/services/discord/channel.ts";
import { Snowflake } from "/scripts/services/discord/snowflake.ts";

import { displayChannel } from "/components/app/views/shared/channel.ts";

import { discordClient } from "/main.ts";

export const render = async (container: HTMLElement, params: URLSearchParams) => {
	const guild = await discordClient.guilds.get(params.get("guildId")!);
	if (!guild) {
		container.innerHTML = "Failed to load guild.";

		return {
			cleanup: () => { },
			title: "Unknown Guild"
		};
	} else {
		const [channels, caretDownIcon, gearIcon, plusIcon, chatTextIcon] = await Promise.all([
			guild.listChannels(),
			getIcon("caret-down"),
			getIcon("gear"),
			getIcon("plus"),
			getIcon("chat-text")
		]);

		const channelsContainer = container.querySelector(".channels") as HTMLElement;

		const parents: Record<Snowflake, HTMLElement> = {};

		const channelContentContainer = container.querySelector(".content") as HTMLElement;
		let channelCleanup: (() => void) | undefined;
		let isLoadingChannel = false;

		for (const category of channels.filter((channel) => channel.type === ChannelType.GuildCategory)) {
			const categoryElement = document.createElement("div");
			categoryElement.classList.add("category");

			const categoryHeaderElement = document.createElement("div");
			categoryHeaderElement.classList.add("category-header");

			const categoryCollapseIndicator = document.createElement("div");
			categoryCollapseIndicator.classList.add("collapse");
			categoryCollapseIndicator.innerHTML = caretDownIcon;

			const nameElement = document.createElement("div");
			nameElement.classList.add("name");
			nameElement.textContent = category.name ?? "Unknown category";

			const categorySettingsButton = document.createElement("button");
			categorySettingsButton.classList.add("settings");
			categorySettingsButton.innerHTML = gearIcon;
			categorySettingsButton.setAttribute("tooltip", "Configure category");
			categorySettingsButton.addEventListener("click", (event) => {
				event.stopPropagation();
			});

			const categoryCreateChannelButton = document.createElement("button");
			categoryCreateChannelButton.classList.add("create-channel");
			categoryCreateChannelButton.innerHTML = plusIcon;
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
			channelSettingsButton.innerHTML = gearIcon;
			channelSettingsButton.setAttribute("tooltip", "Configure");
			channelSettingsButton.addEventListener("click", (event) => {
				event.stopPropagation();
			});

			channelElement.addEventListener("click", async (event) => {
				event.stopPropagation();
				if (!isLoadingChannel) {
					isLoadingChannel = true;

					if (channelCleanup) channelCleanup();

					const currentSelectedChannel = document.querySelector(".channel.selected");
					if (currentSelectedChannel) currentSelectedChannel.classList.remove("selected");
					channelElement.classList.add("selected");

					channelCleanup = await displayChannel(channel, channelContentContainer);
					isLoadingChannel = false;
				}
			});

			if (channel.category === ChannelCategory.Voice) {
				channelElement.classList.add("voice");

				const channelOpenChatButton = document.createElement("button");
				channelOpenChatButton.classList.add("open-chat");
				channelOpenChatButton.innerHTML = chatTextIcon;
				channelOpenChatButton.setAttribute("tooltip", "Open chat");
				channelOpenChatButton.addEventListener("click", async (event) => {
					event.stopPropagation();
					if (!isLoadingChannel) {
						isLoadingChannel = true;


						if (channelCleanup) channelCleanup();

						// TODO: Display chat for this vc
						isLoadingChannel = false;
					}
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
				if (channelCleanup) channelCleanup();
			},
			title: guild.name
		};
	}
};