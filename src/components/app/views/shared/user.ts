import { User } from "/scripts/services/discord/user.ts";

export const displayUserBadge = (user: User<boolean> | string): HTMLElement => {
	const badge = document.createElement("span");
	badge.classList.add("user-badge");

	if (typeof user !== "string") {
		badge.dataset.userId = user.id;

		if (user.avatar) {
			const avatarImg = document.createElement("img");
			avatarImg.classList.add("user-avatar");
			avatarImg.src = user.avatar.getURL("png", 64, "high");
			badge.append(avatarImg);
		}

		const nameSpan = document.createElement("span");
		nameSpan.classList.add("user-name");
		nameSpan.textContent = user.display_name;
		badge.append(nameSpan);
	} else {
		const nameSpan = document.createElement("span");
		nameSpan.classList.add("user-name");
		nameSpan.textContent = user;
		badge.append(nameSpan);
	}

	return badge;
};