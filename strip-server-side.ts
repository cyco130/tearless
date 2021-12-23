import { PluginItem, NodePath } from "@babel/core";
import * as t from "@babel/types";

export default function babelPluginStripServerSide(): PluginItem {
	let removedNodes: NodePath[] = [];

	return {
		visitor: {
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
							binding.path.node.imported.name === "definePage"
						) {
							removedNodes.push(arg);
							arg.replaceWith(t.nullLiteral());
						}
					}
				},
			},

			Program: {
				exit: (program) => {
					// Remove unreferenced bindings
					let removed = false;

					const pathsReferencedByRemovedNodes = Object.values(
						program.scope.bindings,
					)
						.filter((binding) =>
							binding.referencePaths.some((ref) =>
								ref.findParent((p) => removedNodes.includes(p)),
							),
						)
						.map((b) => b.path);

					do {
						program.scope.crawl();
						removed = false;
						for (const binding of Object.values(program.scope.bindings)) {
							if (
								pathsReferencedByRemovedNodes.includes(binding.path) &&
								(!binding.referenced ||
									binding.referencePaths.every((ref) =>
										ref.findParent((p) =>
											pathsReferencedByRemovedNodes.some((r) => p === r),
										),
									))
							) {
								console.log("Removing binding", binding.identifier.name);

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
					} while (removed);
				},
			},
		},
	};
}

function isLocationWithin(
	parent?: t.SourceLocation | null,
	child?: t.SourceLocation | null,
) {
	if (!parent || !child) return false;

	return (
		(parent.start || 0) <= (child.start || 0) &&
		(parent.end || 0) >= (child.end || 0)
	);
}
