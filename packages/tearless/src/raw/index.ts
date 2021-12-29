import { ComponentType } from "react";

export interface TearlessContext<P = never> {
	params: P;
}

export function withParams<P>(): <
	M extends Record<string, (this: TearlessContext<P>, ...args: any) => any> & {
		get?(this: TearlessContext<P>): any;
	},
>(
	methods: M,
	view?: ComponentType<{
		data: Unpromisify<StrictReturnType<M["get"]>>;
		methods: PromisifyMethods<M>;
	}>,
	displayName?: string,
) => any {
	return definePage;
}

export function definePage<P, D>(
	get: (this: TearlessContext<P>) => D,
	view?: ComponentType<{
		data: Unpromisify<D>;
		methods: PromisifyMethods<{ get: typeof get }>;
	}>,
	displayName?: string,
): any;

export function definePage<
	P,
	M extends Record<string, (this: TearlessContext<P>, ...args: any) => any> & {
		get?(this: TearlessContext<P>): any;
	},
>(
	methods: M,
	view?: ComponentType<{
		data: Unpromisify<StrictReturnType<M["get"]>>;
		methods: PromisifyMethods<M>;
	}>,
	displayName?: string,
): any;

export function definePage(
	getOrMethods: any,
	view?: ComponentType<any>,
	displayName?: string,
): any {
	if (view) view.displayName = displayName;

	const methods =
		typeof getOrMethods === "function" ? { get: getOrMethods } : getOrMethods;

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
