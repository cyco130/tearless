import { PluginOption } from "vite";
import { transformAsync, PluginItem, NodePath } from "@babel/core";
import * as t from "@babel/types";

export function babelStripServerSidePlugin(): PluginItem {
	let removedNodes: NodePath[] = [];

	return {
		visitor: {
			// Remove first argument of definePage
			Expression: {
				enter(arg) {
					if (
						arg.parentPath.isCallExpression() &&
						arg.node === arg.parentPath.node.arguments[0] &&
						!t.isNullLiteral(arg.node)
					) {
						const callee = arg.parentPath.node.callee;
						if (!t.isIdentifier(callee)) return;
						const binding = arg.parentPath.scope.getBinding(callee.name);
						if (
							binding &&
							binding.path.isImportSpecifier() &&
							t.isIdentifier(binding.path.node.imported) &&
							binding.path.node.imported.name === "definePage" &&
							binding.path.parentPath.isImportDeclaration() &&
							binding.path.parentPath.node.source.value === "tearless"
						) {
							removedNodes.push(arg);
							arg.replaceWith(t.nullLiteral());
						}
					}
				},
			},

			Program: {
				// Remove top-level bindings and import declarations that were referenced before the removal
				// of the first argument of definePage but are now only refrenced by themselves
				exit: (program) => {
					// Remove unreferenced bindings
					let removed = false;

					const topLevelBindings = Object.values(program.scope.bindings);
					const topLevelSet = new Set(topLevelBindings.map((x) => x.path));
					const alreadyUnreferenced = new Set(
						topLevelBindings.filter((x) => !x.referenced).map((x) => x.path),
					);

					program.scope.crawl();

					for (const binding of Object.values(program.scope.bindings)) {
						if (alreadyUnreferenced.has(binding.path)) {
							continue;
						}

						// Remove if it is unreferenced or if none of its references reach one of these:
						// - an export
						// - a top-level binding that was already unreferenced before we started
						// - a top-level statement that is not a binding
						if (
							!binding.referenced ||
							!binding.referencePaths.some((ref) =>
								ref.findParent(
									(p) =>
										t.isExportDeclaration(p) ||
										(!topLevelSet.has(p) &&
											t.isStatement(p) &&
											t.isProgram(p.parent)) ||
										alreadyUnreferenced.has(p),
								),
							)
						) {
							// If it was an import binding, remove the import
							const parent = binding.path.parentPath;
							if (
								parent &&
								t.isImportDeclaration(parent.node) &&
								parent.node.specifiers.length === 1
							) {
								parent.remove();
							} else {
								binding.path.remove();
							}

							removed = true;
						}
					}
				},
			},
		},
	};
}
