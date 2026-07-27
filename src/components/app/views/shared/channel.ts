import { Channel, ChannelType } from "/scripts/services/discord/channel.ts";

export const displayChannel = async (channel: Channel, container: HTMLElement): Promise<() => void> => {
	const header = container.querySelector(".header") as HTMLElement;
	const content = container.querySelector(".content") as HTMLElement;

	if (channel.topic) {
		const channelNameElement = document.createElement("div");
		channelNameElement.classList.add("name");
		channelNameElement.textContent = channel.name ?? "Unknown channel";

		const separatorElement = document.createElement("div");
		separatorElement.classList.add("separator");
		separatorElement.textContent = "•";

		const topicElement = document.createElement("div");
		topicElement.classList.add("topic");
		topicElement.textContent = channel.topic;

		header.append(channelNameElement, separatorElement, topicElement);
	}

	switch (channel.type) {
		case ChannelType.GuildText: {
			break;
		}

		default: {
			content.innerHTML = `This channel type is not yet supported ("${channel.type}").`;
			break;
		}
	};

	header.classList.remove("loading");
	content.classList.remove("loading");


	return () => {
		content.innerHTML = "";
	};
};