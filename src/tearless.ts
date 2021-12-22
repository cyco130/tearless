import { IncomingMessage } from "http";
import { ComponentType } from "react";

const routes = import.meta.glob("./**/*.route.tsx");

export async function findRoute(path: string): Promise<any> {
	let routeImporter =
		routes["." + path + ".route.tsx"] || routes["." + path + "index.route.tsx"];

	const route = routeImporter
		? await routeImporter()
		: await import("./NotFound");

	return route.default;
}

interface TearlessContext {
	req: IncomingMessage;
}

export function defineRoute<D>(
	get: (this: TearlessContext) => D,
	view?: ComponentType<{
		data: Unpromisify<D>;
		methods: PromisifyMethods<{ get: typeof get }>;
	}>,
	displayName?: string,
): any;

export function defineRoute<
	M extends Record<string, (this: TearlessContext, ...args: any) => any> & {
		get?(this: TearlessContext): any;
	},
>(
	methods: M,
	view?: ComponentType<{
		data: Unpromisify<StrictReturnType<M["get"]>>;
		methods: PromisifyMethods<M>;
	}>,
	displayName?: string,
): any;

export function defineRoute(
	getOrmethods: any,
	view?: ComponentType<any>,
	displayName?: string,
): any {
	if (view) view.displayName = displayName;

	const methods =
		typeof getOrmethods === "function" ? { get: getOrmethods } : getOrmethods;

	return { methods, view };
}

// TODO: We can omit non-function props instead of turning them into never:
// https://stackoverflow.com/questions/46583883/typescript-pick-properties-with-a-defined-type

type PromisifyMethods<M> = {
	[K in keyof M]: M[K] extends (...args: infer A) => infer R
		? (...args: A) => Promisify<R>
		: never;
};

type Promisify<T> = T extends Promise<infer X> ? T : Promise<T>;
type Unpromisify<T> = T extends Promise<infer X> ? Unpromisify<X> : T;
type StrictReturnType<F> = F extends (...args: any) => infer R ? R : never;