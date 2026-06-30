import { getIcon } from "/scripts/lib/icon.ts";

export const render = async (container: HTMLElement, _params: URLSearchParams) => {
	const mercuryIcon = container.querySelector("#mercury-icon") as HTMLElement;
	mercuryIcon.innerHTML = await getIcon("mercury");

	return {
		cleanup: () => {

		},
		title: "Welcome to Mercury"
	};
};