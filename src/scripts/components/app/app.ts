import { store } from "/scripts/store/store.ts";
import html from "./app.html";

export const renderApp = (container: HTMLElement): (() => void) => {
	container.innerHTML = html;

	const usernameElement = container.querySelector(".username");
	const userIdElement = container.querySelector(".user-id");

	const user = store.getState().currentUser;
	if (user) {
		if (usernameElement) usernameElement.textContent = user.username;
		if (userIdElement) userIdElement.textContent = user.id;
	} else {
		const unsubscribe = store.subscribe((state) => {
			if (state.currentUser) {
				if (usernameElement) usernameElement.textContent = state.currentUser.username;
				if (userIdElement) userIdElement.textContent = state.currentUser.id;
				unsubscribe();
			}
		});
		return unsubscribe;
	}

	return () => { };
};