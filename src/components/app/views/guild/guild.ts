import { discordClient } from "/main.ts";

export const render = async (container: HTMLElement, params: URLSearchParams) => {
	let guild = await discordClient.guilds.get(params.get("guildId")!);
	if (!guild) guild = await discordClient.guilds.fetch(params.get("guildId")!);

	if (!guild) {
		container.innerHTML = "Failed to load guild.";

		return {
			cleanup: () => {

			},
			title: "Unknown Guild"
		};
	} else {
		container.innerHTML = `
			<h1>${guild.name}</h1>
			<p>Guild ID: ${guild.id}</p>
			<p>Member Count: ${guild.approximate_member_count ?? "Unknown"}</p>
		`;

		return {
			cleanup: () => {

			},
			title: guild.name
		};
	}
};