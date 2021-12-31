import { UseQueryOptions, UseQueryResult } from "react-query";

export interface TearlessContext {}

export function useServerSideData<T>(
	serverSideFn: (context: TearlessContext) => T,
	options?: UseQueryOptions<T>,
): UseQueryResult<Unpromisify<T>, unknown>;

export { useServerSideData as useSSD };

type Unpromisify<T> = T extends Promise<infer U> ? U : T;
