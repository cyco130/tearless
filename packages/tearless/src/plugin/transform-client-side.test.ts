import { expect, it } from "vitest";
import { babelTransformClientSideHooks } from "./transform-client-side";
import { transformAsync } from "@babel/core";
import { format } from "prettier";

interface Test {
	message: string;
	input: string;
	output: string;
	_?: "only" | "skip";
}

const tests: Test[] = [
	{
		message: "hoists closure",
		input: `
			import { useSSD } from "tearless";
			import { something } from "server-side";
			import { alreadyUnused } from "other-server-side";

			const bar = 1;

			function x(foo) {
				useSSD(() => foo + bar, { option: "qux" });
				useSSD((ctx) => {
					const baz = 2;
					return something(ctx.session.userName);
				});
			}
		`,
		output: `
			const $useSSDModuleId$ = "abc123";
			import { useSSD } from "tearless";
			import { alreadyUnused } from "other-server-side";

			function x(foo) {
				useSSD($useSSDModuleId$, 0, { foo }, { option: "qux" });
				useSSD($useSSDModuleId$, 1, {});
			};
		`,
	},
];

for (const test of tests) {
	const f = test._ === "skip" ? it.skip : test._ === "only" ? it.only : it;

	f(test.message, async () => {
		const result = await transformAsync(trim(test.input), {
			parserOpts: { plugins: ["jsx", "typescript"] },
			plugins: [babelTransformClientSideHooks("abc123")],
		});

		expect(trim(result?.code || "")).to.equal(trim(test.output));
	});
}

function trim(c: string): string {
	return format(c.replace(/(\s|\n|\r)+/g, " ").trim(), {
		filepath: "test.tsx",
	});
}
