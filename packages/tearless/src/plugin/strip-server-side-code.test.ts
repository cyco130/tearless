import { describe, expect, it } from "vitest";
import { babelStripServerSidePlugin } from "./strip-server-side-code";
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
		message: "removes server-side code",
		input: `import {definePage} from "tearless";definePage(() => "delete me", ({data}) => <p>{data}</p>);`,
		output: `import {definePage} from "tearless";definePage(null, ({data}) => <p>{data}</p>);`,
	},
	{
		message: "understands renamed imports",
		input: `import {definePage as definePage2} from "tearless";definePage2(() => "delete me", ({data}) => data);`,
		output: `import {definePage as definePage2} from "tearless";definePage2(null, ({data}) => data);`,
	},
	{
		message: "removes newly unused import",
		input: `import {definePage} from "tearless";import {foo} from "bar";definePage(() => foo(), () => 0);`,
		output: `import {definePage} from "tearless";definePage(null, () => 0);`,
	},
	{
		message: "keeps previously unused import",
		input: `import {definePage} from "tearless";import {foo} from "bar";definePage(() => 0, () => 0);`,
		output: `import {definePage} from "tearless";import {foo} from "bar";definePage(null, () => 0);`,
	},
	{
		message: "removes newly unused function",
		input: `import {definePage} from "tearless";definePage(() => f(), () => 0);function f(){}`,
		output: `import {definePage} from "tearless";definePage(null, () => 0);`,
	},
	{
		message: "keeps previously unused function",
		input: `import {definePage} from "tearless";definePage(() => 0, () => 0);function f(){}`,
		output: `import {definePage} from "tearless";definePage(null, () => 0);function f(){}`,
	},
	{
		message: "removes self-referencing function",
		input: `import {definePage} from "tearless";definePage(() => f(), () => 0);function f(){return f();}`,
		output: `import {definePage} from "tearless";definePage(null, () => 0);`,
	},
	{
		message: "removes mutually recursive functions",
		input: `import {definePage} from "tearless";definePage(() => f(), () => 0);function f(){return g();}function g(){return f();}`,
		output: `import {definePage} from "tearless";definePage(null, () => 0);`,
	},
];

for (const test of tests) {
	const f = test._ === "skip" ? it.skip : test._ === "only" ? it.only : it;

	f(test.message, async () => {
		const result = await transformAsync(trim(test.input), {
			parserOpts: { plugins: ["jsx", "typescript"] },
			plugins: [babelStripServerSidePlugin()],
		});

		expect(trim(result?.code || "")).to.equal(trim(test.output));
	});
}

function trim(c: string): string {
	return format(c.replace(/(\s|\n|\r)+/g, " ").trim(), {
		filepath: "test.tsx",
	});
}
