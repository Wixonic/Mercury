const init = (): (() => void) => {
	console.log("Login view initialized");

	return () => {
		console.log("Login view cleaned up/unloaded");
	};
};

export default init;