export const getCSSVariable = (variableName: string, fallback?: string): string => {
	const element = document.body || document.documentElement;
	const rootStyles = getComputedStyle(element);
	const value = rootStyles.getPropertyValue(variableName).trim();

	if (!value) {
		if (fallback !== undefined) return fallback;
		throw new Error(`CSS variable ${variableName} not found.`);
	}

	return value;
};