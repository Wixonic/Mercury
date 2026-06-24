import { store } from "/scripts/store/store.ts";
import html from "./app.html";

const init = () => {
	const user = store.getState().currentUser;
	if (!user) return;

	console.log(user);
};

export const renderApp = (container: HTMLElement): (() => void) => {
	container.innerHTML = html;

	const user = store.getState().currentUser;
	if (user) init();
	else {
		const unsubscribe = store.subscribe((state) => {
			if (state.currentUser) {
				init();
				unsubscribe();
			}
		});
		return unsubscribe;
	}

	return () => { };
};