import { getIcon } from "/scripts/lib/icon.ts";

export const title = "Welcome to Mercury";

export const render = async (container: HTMLElement) => {
	const mercuryIcon = container.querySelector("#mercury-icon") as HTMLElement;
	mercuryIcon.innerHTML = await getIcon("mercury");

	return () => {

	};
};