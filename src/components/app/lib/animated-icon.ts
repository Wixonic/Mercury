export const animateIcon = (staticIcon: string, animatedIcon: string): HTMLDivElement => {
	const wrapper = document.createElement("div");
	wrapper.classList.add("icon", "animated");
	wrapper.style.setProperty("--static-icon", `url(${staticIcon})`);

	const image = document.createElement("img");
	image.src = animatedIcon;

	wrapper.appendChild(image);
	return wrapper;
};