import { PluginItem, NodePath, Node } from "@babel/core";
import * as t from "@babel/types";

export function babelTransformClientSideHooks(
	moduleId: string,
	modifiedRef: { current: boolean },
): PluginItem {
	const newNodes = new Set<NodePath>();
	let removedPaths: NodePath[] = [];
	let removedNodes: t.Expression[] = [];
	let counter = 0;

	return {
		visitor: {
			// Hoist the closure
			Expression: {
				enter(arg, state) {
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
							(binding.path.node.imported.name === "useServerSideData" ||
								binding.path.node.imported.name === "useSSD") &&
							binding.path.parentPath.isImportDeclaration() &&
							binding.path.parentPath.node.source.value === "tearless" &&
							!newNodes.has(arg)
						) {
							newNodes.add(arg);
							arg.node.extra = arg.node.extra || {};
							arg.node.extra.hoistMe = true;
							state._useSSD = new Set<string>();
							state._parentScope = arg.parentPath.scope;
						}
					}
				},

				exit(arg, state) {
					if (arg.node.extra?.hoistMe) {
						removedPaths.push(arg);
						removedNodes.push(arg.node);

						const replacement = t.identifier("$useSSDModuleId$");

						const closure = Array.from(state._useSSD as Set<string>);

						arg.replaceWith(replacement);

						const args = (arg.parentPath.node as t.CallExpression).arguments;

						const secondArg = args[1];

						args[1] = t.numericLiteral(counter++);

						args[2] = t.objectExpression(
							closure.map((id) =>
								t.objectProperty(
									t.identifier(id),
									t.identifier(id),
									false,
									true,
								),
							),
						);

						if (secondArg) {
							args[3] = secondArg;
						}

						delete state._useSSD;
						delete state._parentScope;
					}
				},
			},

			Identifier: {
				enter(identifier, state) {
					if (state._useSSD) {
						if (
							!state._parentScope.bindings[
								identifier.node.name
							]?.referencePaths.includes(identifier)
						) {
							return;
						}

						state._useSSD.add(identifier.node.name);
					}
				},
			},

			Program: {
				exit(program) {
					if (removedNodes.length) {
						modifiedRef.current = true;
						program.node.body.unshift(
							t.variableDeclaration("const", [
								t.variableDeclarator(
									t.identifier("$useSSDModuleId$"),
									t.stringLiteral(moduleId),
								),
							]),
						);
					} else {
						return;
					}

					// Remove unreferenced top-level bindings
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
						function isUsed(p: NodePath) {
							return (
								(!topLevelSet.has(p) &&
									t.isStatement(p) &&
									t.isProgram(p.parent)) ||
								alreadyUnreferenced.has(p)
							);
						}

						if (
							!binding.referenced ||
							!binding.referencePaths.some(
								(ref) => isUsed(ref) || ref.findParent(isUsed),
							)
						) {
							// If it was the last import binding, remove the import, otherwise remove the binding
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
						}
					}
				},
			},
		},
	};
}
