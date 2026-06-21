// import QRCode from "qrcode";

import { DiscordClient } from "/scripts/discord.ts";
import { view } from "/scripts/lib/view.ts";

const main = async () => {
	const discordClient = new DiscordClient(new URL("https://discord.com/api/v10"));

	discordClient.token = localStorage.getItem("discord_token") ?? undefined;
	if (!discordClient.token) await view("login");
	else await view("app");
};

addEventListener("DOMContentLoaded", main);