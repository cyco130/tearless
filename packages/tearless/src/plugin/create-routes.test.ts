import { describe, expect, it } from "vitest";
import { createCommonPrefixTree, createRouteImporterModule } from "./plugin";

describe("Routes", () => {
	it("creates tree", () => {
		const tree = createCommonPrefixTree([
			["/", "root"],
			["/a", "a"],
			["/a/1", "a1"],
			["/a/2", "a2"],
			["/b/1", "b1"],
			["/b/2", "b2"],
		]);

		expect(tree).toMatchObject({
			".": "root",
			a: {
				".": "a",
				1: { ".": "a1" },
				2: { ".": "a2" },
			},
			b: {
				1: { ".": "b1" },
				2: { ".": "b2" },
			},
		});
	});

	it("encodes parameters", () => {
		const tree = createCommonPrefixTree([
			["/bar", 1],
			["/[foo]", 2],
			["/[foo]/baz", 3],
			["/[...qux]", 4],
		]);

		expect(tree).toMatchObject({
			"bar": { ".": 1 },
			"*": {
				".": 2,
				"..": "foo",
				baz: { ".": 3 },
			},
			"**": {
				".": 4,
				"..": "qux",
			},
		});
	});
});

describe("Routes importer", () => {
	it("creates module", () => {
		const files = [
			"/b/index.long.ext",
			"/a.ext",
			"/[...e].ext",
			"/index.ext",
			"/[c]/index.ext",
			"/[c]/d.ext",
		];

		const module = createRouteImporterModule(files, ["ext", "long.ext"], ".");

		expect(module).to.equal(EXPECTED_MODULE_CONTENTS);
	});
});

const EXPECTED_MODULE_CONTENTS = `const tree = {
  "*": {
    ".": ["./[c]/index.ext", () => import("./[c]/index.ext")],
    "..": "c",
    "d": {
      ".": ["./[c]/d.ext", () => import("./[c]/d.ext")],
    },
  },
  "**": {
    ".": ["./[...e].ext", () => import("./[...e].ext")],
    "..": "e",
  },
  ".": ["./index.ext", () => import("./index.ext")],
  "a": {
    ".": ["./a.ext", () => import("./a.ext")],
  },
  "b": {
    ".": ["./b/index.long.ext", () => import("./b/index.long.ext")],
  },
};
export default tree;
`;
