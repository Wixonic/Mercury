export const join = (base: string, ...path: string[]): string => {
	const baseClean = base.endsWith("/") ? base.slice(0, -1) : base;
	let pathClean = "";
	for (const segment of path) pathClean += `${segment.startsWith("/") ? "" : "/"}${segment}`;
	return `${baseClean}${pathClean}`;
};