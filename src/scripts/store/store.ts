export type PresenceStatus = "online" | "idle" | "dnd" | "invisible" | "offline";

export interface Session {
	session_id: string;
	status: PresenceStatus;
	activities: any[];
	client_info: {
		os: string;
		client: string;
		version: number;
	};
	active: boolean;
}

export interface AppState {
	route: "login" | "app";
	token: string | null;
	currentUser: any | null;
	sessions: Session[];
	currentPresence: PresenceStatus | null;
}

type StateListener = (state: AppState) => void;

class Store {
	private state: AppState = {
		route: localStorage.getItem("discord_token") ? "app" : "login",
		token: localStorage.getItem("discord_token"),
		currentUser: null,
		sessions: [],
		currentPresence: null
	};

	private listeners: Set<StateListener> = new Set();

	getState(): AppState {
		return { ...this.state };
	}

	setState(update: Partial<AppState>) {
		this.state = { ...this.state, ...update };
		if (update.token !== undefined) {
			if (update.token) localStorage.setItem("discord_token", update.token);
			else localStorage.removeItem("discord_token");
		}

		this.notify();
	}

	subscribe(listener: StateListener): () => void {
		this.listeners.add(listener);
		listener(this.getState());
		return () => {
			this.listeners.delete(listener);
		};
	}

	private notify() {
		const state = this.getState();
		this.listeners.forEach((listener) => listener(state));
	}
}

export const store = new Store();