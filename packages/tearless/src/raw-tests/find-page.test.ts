import { it, expect } from "vitest";
import { findPage } from "../raw/find-page";

const pages = {
	".": "home",
	"about": {
		".": "about",
		"deep": {
			".": "deep",
		},
		"**": {
			".": "catch-all",
			"..": "slug",
		},
	},
	"artcle": {
		"list": {
			".": "article-list",
		},
		"*": {
			".": "article",
			"..": "articleId",
			"deeper": {
				".": "deeper",
			},
		},
	},
};

it("finds normal pages", () => {
	expect(findPage("/", pages)).toMatchObject([{}, "home"]);
	expect(findPage("/about", pages)).toMatchObject([{}, "about"]);
	expect(findPage("/about/deep", pages)).toMatchObject([{}, "deep"]);
	expect(findPage("/404/", pages)).toMatchObject([{}, undefined]);
});

it("finds params", () => {
	expect(findPage("/artcle/123", pages)).toMatchObject([
		{ articleId: "123" },
		"article",
	]);

	expect(findPage("/artcle/123/deeper", pages)).toMatchObject([
		{ articleId: "123" },
		"deeper",
	]);
});

it("finds catch-all", () => {
	expect(findPage("/about/1/2/3", pages)).toMatchObject([
		{ slug: ["1", "2", "3"] },
		"catch-all",
	]);
});

it("prioritizes specific page", () => {
	expect(findPage("/artcle/list", pages)).toMatchObject([{}, "article-list"]);
});
