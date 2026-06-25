export const join = (base: string, path: string): string => {
	const baseClean = base.endsWith("/") ? base.slice(0, -1) : base;
	const pathClean = path.startsWith("/") ? path : `/${path}`;

	return `${baseClean}${pathClean}`;
};

export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
	const bytes = new Uint8Array(buffer);
	let binary = "";

	for (let i = 0; i < bytes.byteLength; i++) {
		binary += String.fromCharCode(bytes[i]);
	}

	return btoa(binary);
};

export const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);

	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}

	return bytes.buffer;
};

export const base64URLEncode = (buffer: ArrayBuffer): string => {
	return arrayBufferToBase64(buffer)
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/, "");
};

export const base64URLDecode = (base64URL: string): ArrayBuffer => {
	let base64 = base64URL.replace(/-/g, "+").replace(/_/g, "/");

	while (base64.length % 4) {
		base64 += "=";
	}

	return base64ToArrayBuffer(base64);
};

export const getCSSVariable = (variableName: string, fallback?: string): string => {
	const element = document.body || document.documentElement;
	const rootStyles = getComputedStyle(element);
	const value = rootStyles.getPropertyValue(variableName).trim();

	if (!value) {
		if (fallback) return fallback;
		throw new Error(`CSS variable ${variableName} not found.`);
	}

	return value;
};

export const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));