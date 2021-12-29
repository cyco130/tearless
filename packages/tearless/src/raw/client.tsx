import React, { ReactElement } from "react";
import { findPage } from "./find-page";

// @ts-expect-error
import pages from "tearless/pages";

export async function renderPage(
	path: string,
	data: any,
	dispatcher: Dispatcher,
): Promise<[name: string, view: ReactElement] | null> {
	const [params, node] = findPage(path, pages);
	if (!node) return null;

	const [name, importer] = node;

	const module = await importer();

	const { default: page } = module;

	if (!page || typeof page !== "object") return null;

	const View = page.view;

	return [
		name,
		<View
			data={data}
			methods={
				new Proxy(
					{},
					{
						get: (_, name) => {
							if (typeof name !== "string") return undefined;

							return async function (...args: any) {
								return dispatcher(name, ...args);
							};
						},
					},
				)
			}
		/>,
	];
}

type Dispatcher = (method: string, ...args: any[]) => Promise<any>;
