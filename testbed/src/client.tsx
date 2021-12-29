import { hydrate } from "react-dom";
import { renderPage } from "tearless/client";
import * as jsons from "@brillout/json-s";

const root = document.getElementById("app");

renderPage(
	window.location.pathname,
	(window as any).__INITIAL_DATA__,
	async (method, ...args) => {
		return fetch(`/_data${location.pathname}`, {
			method: method === "get" ? "GET" : "POST",
			body: jsons.stringify([method, ...args]),
		})
			.then((res) => res.text())
			.then((text) => jsons.parse(text));
	},
).then((rendered) => {
	let view = rendered && rendered[1];

	hydrate(view!, root);
});
