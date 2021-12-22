// Make vite client types available
/// <reference types="vite/client" />

import { IncomingMessage, ServerResponse } from "http";
import { findRoute } from "./tearless";
import { renderToString } from "react-dom/server";
import { stringify, parse } from "@brillout/json-s";

export async function handleRequest(
	req: IncomingMessage,
	res: ServerResponse,
	clientScript: string,
	processHtml?: (path: string, html: string) => Promise<string>,
) {
	console.log("Handling", req.url);

	res.setHeader("Content-Type", "text/html; charset=utf-8");

	let { url = "/" } = req;
	let route = await findRoute(url);

	// Allow simple component exports
	if (typeof route !== "object") {
		route = { methods: {}, view: route };
	}

	const { methods, view: Page } = route;
	debugger;

	if (req.method === "GET" && Page) {
		// Render component
		const get = methods.get?.bind({ req });
		const data = await get?.(req);
		const page = renderToString(<Page data={data} />);
		const src = JSON.stringify(clientScript);

		let html = `<!DOCTYPE html>
			<html>
			<head>
				<title>Tearless</title>
				<script>window.__INITIAL_DATA__ = ${stringify(data)}</script>
				<script type="module" src=${src}></script>
			</head>
			<body>
				<div id="app">${page}</div>
			</body>
		</html>`;

		if (processHtml) html = await processHtml(url, html);

		res.setHeader("Content-Type", "text/html; charset=utf-8");
		res.end(html);
	} else {
		const methodNameMap: Record<string, string> = {
			GET: "get",
			POST: "post",
			PUT: "put",
			DELETE: "del",
			PATCH: "patch",
		};

		// TODO: Handle OPTIONS
		const methodName = String(
			req.headers["x-tearless-method-name"] ||
				methodNameMap[req.method || ""] ||
				"get",
		);

		// Parse body as string
		const body = await new Promise<string>((resolve, reject) => {
			let body = "";
			req.setEncoding("utf8");
			req.on("data", (chunk) => {
				body += chunk;
			});

			req.on("end", () => resolve(body));
			req.on("error", reject);
		});

		// TODO: Validate body
		const parsed = body === "" ? [] : parse(body);
		const method = methods[methodName];
		const data = await method?.bind({ req })(...parsed);

		res.setHeader("Content-Type", "application/json");
		res.end(stringify(data));
	}
}
