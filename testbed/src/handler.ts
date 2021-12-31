import type { RequestHandler } from "vavite";
import manifest from "@vavite/manifest";
import { parse, stringify } from "@brillout/json-s";

// @ts-expect-error
import tearlessManifest from "@tearless/manifest";

const TEARLESS_PREFIX = "/_tearless/";

const handler: RequestHandler = async (req) => {
	if (req.url.pathname.startsWith(TEARLESS_PREFIX) && req.method === "POST") {
		const hookNo = parseInt(req.url.searchParams.get("n") || "0");
		const moduleId = req.url.pathname.slice(TEARLESS_PREFIX.length);
		const closure = parse(await req.body.text());
		const { $useSSD$ } = await tearlessManifest[moduleId]();
		const result = await $useSSD$[hookNo](closure, {});

		return {
			status: 200,
			body: stringify(result),
		};
	}

	return {
		headers: {
			"content-type": "text/html",
		},

		body: `<!DOCTYPE html>
			<html>
				<head>
					<meta charset="utf-8" />
					<title>Tearless Testbed</title>
				</head>
				<body>
					<div id="root"></div>
					<script type="module" src="${manifest["client.tsx"].file}"></script>
				</body>
			</html>`,
	};
};

export default handler;
