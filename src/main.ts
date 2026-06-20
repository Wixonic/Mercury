import { DiscordClient } from "/scripts/discord.ts";

const main = async () => {
	const discordClient = new DiscordClient(new URL("https://discord.com/api/v10"));
	await discordClient.init();
};

addEventListener("DOMContentLoaded", main);