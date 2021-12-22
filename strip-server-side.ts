import { PluginOption } from "vite";

import { PluginItem } from "@babel/core";
import * as t from "@babel/types";

export function babelPluginStripServerSide(): PluginItem {
	return {
		visitor: {
			CallExpression(path, ...args: any) {
				if (
					path.node.callee.type === "Identifier" &&
					path.node.callee.name === "defineRoute"
				) {
					path.node.arguments[0] = t.unaryExpression(
						"void",
						t.numericLiteral(0),
					);
				}
			},
		},
	};
}
