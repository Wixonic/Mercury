import { getIcon } from "/scripts/lib/icon.ts";

import { displayChannel } from "/components/app/views/shared/channel.ts";

import { discordClient } from "/main.ts";

export const render = async (container: HTMLElement, params: URLSearchParams) => {
	const [channels, gearIcon] = await Promise.all([
		discordClient.listDMs(),
		getIcon("gear")
	]);

	const channelsContainer = container.querySelector(".channels") as HTMLElement;

	let channelCleanup: (() => void) | undefined;
	let isLoadingChannel = false;

	const targetChannelId = params.get("channelId");

	for (const channel of channels) {
		const channelElement = document.createElement("div");
		channelElement.classList.add("channel");

		const nameElement = document.createElement("div");
		nameElement.classList.add("name");
		nameElement.textContent = await channel.getDisplayName();

		const channelSettingsButton = document.createElement("button");
		channelSettingsButton.classList.add("settings");
		channelSettingsButton.innerHTML = gearIcon;
		channelSettingsButton.setAttribute("tooltip", "Configure");
		channelSettingsButton.addEventListener("click", (event) => {
			event.stopPropagation();
		});

		const selectChannel = async () => {
			if (!isLoadingChannel) {
				isLoadingChannel = true;

				if (channelCleanup) channelCleanup();

				const currentSelectedChannel = document.querySelector(".channel.selected");
				if (currentSelectedChannel) currentSelectedChannel.classList.remove("selected");
				channelElement.classList.add("selected");

				channelCleanup = await displayChannel(channel, container);
				isLoadingChannel = false;
			}
		};

		channelElement.addEventListener("click", async (event) => {
			event.stopPropagation();
			await selectChannel();
		});

		channelElement.append(nameElement, channelSettingsButton);
		channelsContainer.append(channelElement);

		if (targetChannelId && channel.id === targetChannelId) selectChannel();
	}

	channelsContainer.classList.remove("loading");

	return {
		cleanup: () => {
			if (channelCleanup) channelCleanup();
		},
		title: "Direct Messages"
	};
};