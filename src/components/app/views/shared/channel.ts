import { Channel, ChannelType } from "/scripts/services/discord/channel.ts";

export const displayChannel = async (channel: Channel, container: HTMLElement): Promise<() => void> => {
	switch (channel.type) {
		case ChannelType.GuildText: {
			container.innerHTML = channel.topic ?? "No topic set.";
			break;
		}

		default: {
			container.innerHTML = `This channel type is not yet supported ("${channel.type}").`;
			break;
		}
	};


	return () => {

	};
};