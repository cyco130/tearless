export function findPage(path: string, pages: any): [params: any, page?: any] {
	const segments = path.split("/").filter(Boolean);
	const params: Record<string, any> = {};

	for (const [i, segment] of segments.entries()) {
		if (pages[segment]) {
			pages = pages[segment];
		} else if (pages["*"]) {
			pages = pages["*"];
			params[pages[".."]] = segment;
		} else if (pages["**"]) {
			pages = pages["**"];
			const name = pages[".."];
			params[name] = segments.slice(i);
			break;
		} else {
			return [params, undefined];
		}
		// if (!pages[segment]) return [params];
	}

	return [params, pages["."]];
}
