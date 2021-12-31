import { expect, it } from "vitest";
import { babelTransformServerSideHooks } from "./transform-server-side";
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
			const bar = 1;
			function x(foo) {
				useSSD(() => foo + bar, { options: "qux" });
				useSSD((ctx) => {
					const baz = 2;
					return ctx.session.userName;
				});
			}
		`,
		output: `
			import { useSSD } from "tearless";
			const bar = 1;
			function x(foo) {
				useSSD($useSSD$[0], { foo });
				useSSD($useSSD$[1], {});
			};

			export const $useSSD$ = [
				($useSSDClosure$) => {
					let { foo } = $useSSDClosure$;
					return foo + bar;
				},
				($useSSDClosure$, ctx) => {
					let { } = $useSSDClosure$;
					const baz = 2;
					return ctx.session.userName;
				}
			]
		`,
	},
];

for (const test of tests) {
	const f = test._ === "skip" ? it.skip : test._ === "only" ? it.only : it;

	f(test.message, async () => {
		const result = await transformAsync(trim(test.input), {
			parserOpts: { plugins: ["jsx", "typescript"] },
			plugins: [babelTransformServerSideHooks()],
		});

		expect(trim(result?.code || "")).to.equal(trim(test.output));
	});
}

function trim(c: string): string {
	return format(c.replace(/(\s|\n|\r)+/g, " ").trim(), {
		filepath: "test.tsx",
	});
}
