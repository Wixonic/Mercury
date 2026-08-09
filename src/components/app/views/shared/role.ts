import { Role } from "/scripts/services/discord/role.ts";

export const displayRoleBadge = (role: Role): HTMLElement => {
	const badge = document.createElement("span");
	badge.classList.add("role-badge");
	badge.dataset.roleId = role.id;

	if (role.color) {
		const hex = `#${role.color.toString(16).padStart(6, "0")}`;
		badge.style.setProperty("--role-color", hex);
		badge.style.color = hex;
		badge.style.borderColor = `color-mix(in srgb, ${hex} 40%, transparent)`;
		badge.style.backgroundColor = `color-mix(in srgb, ${hex} 15%, transparent)`;
	}

	if (role.icon) {
		const iconImg = document.createElement("img");
		iconImg.classList.add("role-icon");
		iconImg.src = role.icon.getURL("png", 64, "high");
		badge.append(iconImg);
	} else if (role.unicode_emoji) {
		const emojiSpan = document.createElement("span");
		emojiSpan.classList.add("role-emoji");
		emojiSpan.textContent = role.unicode_emoji;
		badge.append(emojiSpan);
	}

	const nameSpan = document.createElement("span");
	nameSpan.classList.add("role-name");
	nameSpan.textContent = `@${role.name}`;
	badge.append(nameSpan);

	return badge;
};