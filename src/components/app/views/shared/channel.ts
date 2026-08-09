import { Channel, ChannelType } from "/scripts/services/discord/channel.ts";
import { GatewayDispatchEvent } from "/scripts/services/discord/gateway.ts";
import { Message, MessageType } from "/scripts/services/discord/message.ts";

import { displayRoleBadge } from "/components/app/views/shared/role.ts";
export { displayRoleBadge } from "/components/app/views/shared/role.ts";

import { displayUserBadge } from "/components/app/views/shared/user.ts";
export { displayUserBadge } from "/components/app/views/shared/user.ts";

import { discordClient } from "/main.ts";

const renderNoAccess = (container: HTMLElement, channel: Channel): (() => void) => {
	const noAccessContainer = document.createElement("div");
	noAccessContainer.classList.add("no-access");

	const titleElement = document.createElement("h3");
	titleElement.textContent = "You do not have access to this channel.";
	noAccessContainer.append(titleElement);

	container.append(noAccessContainer);

	let isCleanedUp = false;

	channel.getAllowedAccess().then((allowed) => {
		if (isCleanedUp) return;
		if (allowed.roles.length > 0 || allowed.rolePlaceholders.length > 0 || allowed.members.length > 0) {
			const infoElement = document.createElement("p");
			infoElement.textContent = "The following roles and members have access:";
			noAccessContainer.append(infoElement);

			const listElement = document.createElement("div");
			listElement.classList.add("allowed-list");

			for (const role of allowed.roles) listElement.append(displayRoleBadge(role));

			for (const roleName of allowed.rolePlaceholders) {
				const badge = document.createElement("span");
				badge.classList.add("role-badge");
				badge.textContent = roleName;
				listElement.append(badge);
			}

			for (const member of allowed.members) listElement.append(displayUserBadge(member));

			noAccessContainer.append(listElement);
		}
	});

	return () => { isCleanedUp = true; };
};

export const displayChannel = async (channel: Channel, container: HTMLElement, forceText = false): Promise<() => void> => {
	const header = container.querySelector(".header") as HTMLElement;
	const content = container.querySelector(".content") as HTMLElement;

	header.innerHTML = "";

	const channelIconElement = await channel.getIconElement();
	header.append(channelIconElement);

	const channelNameElement = document.createElement("div");
	channelNameElement.classList.add("name");
	channelNameElement.textContent = typeof channel.getDisplayName === "function" ? await channel.getDisplayName() : (channel.name ?? "Unknown channel");
	header.append(channelNameElement);

	if (channel.topic) {
		const separatorElement = document.createElement("div");
		separatorElement.classList.add("separator");
		separatorElement.textContent = "•";

		const topicElement = document.createElement("div");
		topicElement.classList.add("topic");
		topicElement.textContent = channel.topic;

		header.append(separatorElement, topicElement);
	}

	if (!channel.isAccessible) {
		const cleanupNoAccess = renderNoAccess(content, channel);
		header.classList.remove("loading");
		content.classList.remove("loading");

		return () => {
			cleanupNoAccess();
			header.innerHTML = "";
			content.innerHTML = "";
		};
	}

	let handleMessageCreate: ((event: Event) => void) | undefined;
	let handleScroll: (() => Promise<void>) | undefined;

	switch (forceText ? ChannelType.GuildText : channel.type) {
		case ChannelType.GuildText:
		case ChannelType.DM:
		case ChannelType.GroupDM:
		case ChannelType.GuildNews:
		case ChannelType.NewsThread:
		case ChannelType.PublicThread:
		case ChannelType.PrivateThread:
		case ChannelType.EphemeralDM: {
			const messagesContainer = document.createElement("div");
			messagesContainer.classList.add("messages");
			content.append(messagesContainer);

			let oldestMessageId: string | undefined;
			let lastMessage: Message | undefined;
			let isLoadingMore = false;
			let hasMore = true;

			try {
				const initialMessages = await channel.listMessages(50);
				if (initialMessages.length < 50) hasMore = false;
				if (initialMessages.length > 0) {
					oldestMessageId = initialMessages[0].id;
					lastMessage = initialMessages[initialMessages.length - 1];
				}

				for (let i = 0; i < initialMessages.length; i++) {
					const message = initialMessages[i];
					const prev = i > 0 ? initialMessages[i - 1] : undefined;
					const grouped = prev !== undefined
						&& prev.author.id === message.author.id
						&& message.timestamp && prev.timestamp
						&& (message.timestamp.getTime() - prev.timestamp.getTime()) < 600000
						&& message.type !== MessageType.Reply;
					messagesContainer.append(message.render(!!grouped));
				}
				if (!hasMore) {
					const historyStart = document.createElement("div");
					historyStart.classList.add("history-start");

					const title = document.createElement("h3");
					title.textContent = channel.type === ChannelType.DM || channel.type === ChannelType.GroupDM || channel.type === ChannelType.EphemeralDM
						? "It started here"
						: `Welcome to #${channel.displayName}!`;

					const desc = document.createElement("p");
					desc.textContent = channel.type === ChannelType.DM || channel.type === ChannelType.GroupDM || channel.type === ChannelType.EphemeralDM
						? "This is the beginning of your conversation."
						: `This is the beginning of the history for the channel #${channel.displayName}.`;

					historyStart.append(title, desc);
					messagesContainer.prepend(historyStart);
				}

				content.scrollTop = content.scrollHeight;
				requestAnimationFrame(() => { content.scrollTop = content.scrollHeight; });
			} catch (error: any) {
				if (error?.message?.includes("403") || error?.message?.includes("Missing Access")) {
					messagesContainer.innerHTML = "";
					const cleanupNoAccess = renderNoAccess(messagesContainer, channel);
					header.classList.remove("loading");
					content.classList.remove("loading");

					return () => {
						cleanupNoAccess();
						header.innerHTML = "";
						content.innerHTML = "";
					};
				}
				throw error;
			}

			handleScroll = async () => {
				if (isLoadingMore || !hasMore || !oldestMessageId || content.scrollTop > 50) return;
				isLoadingMore = true;

				const olderMessages = await channel.listMessages({ before: oldestMessageId, limit: 50 });
				if (olderMessages.length < 50) hasMore = false;

				if (olderMessages.length > 0) {
					oldestMessageId = olderMessages[0].id;
					const previousScrollHeight = content.scrollHeight;
					const previousScrollTop = content.scrollTop;

					for (let index = olderMessages.length - 1; index >= 0; index--) {
						const message = olderMessages[index];
						const prev = index > 0 ? olderMessages[index - 1] : undefined;
						const grouped = prev !== undefined
							&& prev.author.id === message.author.id
							&& message.timestamp && prev.timestamp
							&& (message.timestamp.getTime() - prev.timestamp.getTime()) < 600000
							&& message.type !== MessageType.Reply;

						const rendered = message.render(!!grouped);
						messagesContainer.prepend(rendered);
					}

					if (!hasMore) {
						const historyStart = document.createElement("div");
						historyStart.classList.add("history-start");

						const title = document.createElement("h3");
						title.textContent = channel.type === ChannelType.DM || channel.type === ChannelType.GroupDM || channel.type === ChannelType.EphemeralDM
							? "It started here"
							: `Welcome to #${channel.displayName}!`;

						const desc = document.createElement("p");
						desc.textContent = channel.type === ChannelType.DM || channel.type === ChannelType.GroupDM || channel.type === ChannelType.EphemeralDM
							? "This is the beginning of your conversation."
							: `This is the beginning of the history for the channel #${channel.displayName}.`;

						historyStart.append(title, desc);
						messagesContainer.prepend(historyStart);
					}

					content.scrollTop = previousScrollTop + (content.scrollHeight - previousScrollHeight);
				}

				isLoadingMore = false;
			};

			content.addEventListener("scroll", handleScroll);

			handleMessageCreate = (event: Event) => {
				const messageData = (event as CustomEvent).detail;
				if (messageData.channel_id === channel.id) {
					const message = new Message(messageData);

					const grouped = lastMessage !== undefined
						&& lastMessage.author.id === message.author.id
						&& message.timestamp && lastMessage.timestamp
						&& (message.timestamp.getTime() - lastMessage.timestamp.getTime()) < 600000
						&& message.type !== MessageType.Reply;

					const isNearBottom = content.scrollHeight - content.scrollTop - content.clientHeight < 50;
					messagesContainer.append(message.render(!!grouped));
					if (isNearBottom) content.scrollTop = content.scrollHeight;
					lastMessage = message;
				}
			};

			discordClient.addEventListener(GatewayDispatchEvent.MessageCreate, handleMessageCreate);

			const actionbar = container.querySelector(".actionbar") as HTMLElement;
			if (channel.canSendMessages) {
				const inputBar = document.createElement("div");
				inputBar.classList.add("input-bar");

				const textarea = document.createElement("textarea") as HTMLTextAreaElement;
				textarea.classList.add("message-input");
				textarea.placeholder = `Message ${channel.type === ChannelType.DM || channel.type === ChannelType.GroupDM ? channel.displayName : "#" + channel.displayName}`;
				textarea.rows = 1;

				textarea.addEventListener("input", () => {
					textarea.style.height = "auto";
					textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";
				});

				textarea.addEventListener("keydown", async (event) => {
					if (event.key === "Enter" && !event.shiftKey) {
						event.preventDefault();
						const text = textarea.value.trim();
						if (!text) return;
						textarea.value = "";
						textarea.style.height = "auto";

						await discordClient.rest.request(`/channels/${channel.id}/messages`, {
							method: "POST",
							body: JSON.stringify({ content: text })
						});
					}
				});

				inputBar.append(textarea);
				actionbar.append(inputBar);
				actionbar.classList.remove("loading");
			} else actionbar.classList.add("hidden");

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
		if (handleMessageCreate) discordClient.removeEventListener(GatewayDispatchEvent.MessageCreate, handleMessageCreate);
		if (handleScroll) content.removeEventListener("scroll", handleScroll);
		header.innerHTML = "";
		content.innerHTML = "";
		const actionbar = container.querySelector(".actionbar") as HTMLElement;
		if (actionbar) {
			actionbar.innerHTML = "";
			actionbar.className = "actionbar loading";
		}
	};
};