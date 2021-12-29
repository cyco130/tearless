import { TearlessContext } from ".";
import { findPage } from "./find-page";

// @ts-expect-error
import pages from "tearless/pages";

export async function renderData(
	path: string,
	context: Omit<TearlessContext, "params">,
	method: string,
	...args: any[]
): Promise<any> {
	const [params, node] = findPage(path, pages);
	if (!node) return;

	const [_name, importer] = node;

	const module = await importer();
	const { default: page } = module;

	if (!page || typeof page !== "object") return;

	return page.methods[method]?.bind({ ...context, params })(...args);
}

export async function renderPage(
	path: string,
	context: Omit<TearlessContext, "params">,
): Promise<{ data: any; view: any; name: string } | undefined> {
	const [params, node] = findPage(path, pages);
	if (!node) return;

	const [name, importer] = node;

	const module = await importer();
	const { default: page } = module;

	if (!page || typeof page !== "object") return;

	const data = await page.methods.get?.bind({ ...context, params })();
	const view = page.view;

	return { data, view, name };
}
