export const join = (base: string, path: string): string => {
	const baseClean = base.endsWith("/") ? base.slice(0, -1) : base;
	const pathClean = path.startsWith("/") ? path : `/${path}`;

	return `${baseClean}${pathClean}`;
};