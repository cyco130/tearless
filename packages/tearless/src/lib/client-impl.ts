import { useQuery, UseQueryOptions } from "react-query";
import { parse, stringify } from "@brillout/json-s";

export function useServerSideData(
	moduleId: string,
	hookNo: number,
	closure: Record<string, unknown>,
	options?: UseQueryOptions,
) {
	return useQuery(`$useSSD$:${moduleId}:${hookNo}:${stringify(closure)}`, () =>
		fetch(`/_tearless/${moduleId}?n=${hookNo}`, {
			method: "POST",
			body: stringify(closure),
		}).then(async (r) => parse(await r.text())),
	);
}

export { useServerSideData as useSSD };
