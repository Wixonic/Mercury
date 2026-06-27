export const getIcon = async (name: string): Promise<string> => {
	try {
		const response = await fetch(`/assets/icon/${name}.svg`);
		return await response.text();
	} catch (error) {
		console.error(`Failed to fetch icon: ${name}`, error);
		return "";
	}
};