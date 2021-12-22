import { hydrate } from "react-dom";
import { findRoute } from "./tearless";
import { stringify, parse } from "@brillout/json-s";

main().catch((err) => console.error(err));

async function main() {
	const route = await findRoute(window.location.pathname);
	const Page = route.view;

	// A proxy to turn function calls into fetch requests
	const methods = new Proxy(
		{},
		{
			get: (_, name) => {
				return async function (...args: any) {
					return await fetch(window.location.pathname, {
						// TODO: Map common method names to their HTTP verbs
						method: name === "get" ? "GET" : "POST",
						headers: {
							"content-type": "application/json",
							"x-tearless-method-name": String(name),
						},
						body: name === "get" ? null : stringify(args),
					}).then(async (x) => parse(await x.text()));
				};
			},
		},
	);

	const container = document.getElementById("app");

	const data = parse((window as any).__INITIAL_DATA__);

	hydrate(<Page data={data} methods={methods} />, container);
}
