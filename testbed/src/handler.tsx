import type { RequestHandler } from "vavite";
import manifest from "@vavite/manifest";
import { renderToString } from "react-dom/server";
import { renderPage, renderData } from "tearless/server";
import * as jsons from "@brillout/json-s";
import React from "react";

const handler: RequestHandler = async (req) => {
	if (req.url.pathname.startsWith("/_data")) {
		const text = await req.body.text();
		const [method, ...args] =
			req.method === "GET" ? ["get"] : jsons.parse(text);

		const data = await renderData(
			req.url.pathname.slice(6),
			{},
			method,
			...args,
		);

		return {
			status: 200,
			headers: {
				"Content-Type": "application/json",
			},
			body: jsons.stringify(data),
		};
	}

	const result = await renderPage(req.url.pathname, { hey: "ho" });

	if (!result) {
		return {
			status: 404,
			body: "Not Found",
		};
	}

	const { data, view: Component, name } = result;
	const rendered = renderToString(
		<React.StrictMode>
			<Component data={data} />
		</React.StrictMode>,
	);

	return {
		headers: { "content-type": "text/html" },
		body: renderHtml(data, rendered, ["client.tsx", name.slice(1)]),
	};
};

export default handler;

function renderHtml(
	initialData: string,
	contents: string,
	entries: string[],
): string {
	const entrySet = new Set(entries);
	const scripts = new Set<string>();
	const css = new Set<string>();

	for (const entry of entrySet) {
		const chunk = manifest[entry];
		if (chunk) {
			scripts.add(chunk.file);
			chunk.imports?.forEach((i) => entrySet.add(i));
			chunk.css?.forEach((i) => css.add(i));
		}
	}

	return `<!DOCTYPE html>
		<html>
			<head>
				<meta charset="utf-8" />
				<title>Tearless</title>
				${[...css].map((s) => `<link rel="stylesheet" href="/${s}" />`).join("\n")}
				<script>__INITIAL_DATA__=${jsons
					.stringify(initialData)
					.replace(/</g, "\\u003c")}</script>
			</head>
			<body>
				<div id="app">${contents}</div>
				${[...scripts]
					.map((s) => `<script type="module" src="/${s}"></script>`)
					.join("\n")}
			</body>
		</html>`;
}
