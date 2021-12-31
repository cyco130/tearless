import { PluginItem, NodePath, Node } from "@babel/core";
import * as t from "@babel/types";

export function babelTransformServerSideHooks(): PluginItem {
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

						const replacement = t.memberExpression(
							t.identifier("$useSSD$"),
							t.numericLiteral(counter++),
							true,
						);

						const closure = Array.from(state._useSSD as Set<string>);

						if (
							t.isArrowFunctionExpression(arg.node) ||
							t.isFunctionExpression(arg.node)
						) {
							arg.node.params.unshift(t.identifier("$useSSDClosure$"));

							if (t.isExpression(arg.node.body)) {
								arg.node.body = t.blockStatement([
									t.returnStatement(arg.node.body),
								]);
							}

							arg.node.body.body.unshift(
								t.variableDeclaration("let", [
									t.variableDeclarator(
										t.objectPattern(
											closure.map((name) =>
												t.objectProperty(
													t.identifier(name),
													t.identifier(name),
													false,
													true,
												),
											),
										),
										t.identifier("$useSSDClosure$"),
									),
								]),
							);
						}

						const args = (arg.parentPath.node as t.CallExpression).arguments;

						arg.replaceWith(replacement);

						args[1] = t.objectExpression(
							closure.map((id) =>
								t.objectProperty(
									t.identifier(id),
									t.identifier(id),
									false,
									true,
								),
							),
						);

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
				exit(program, state) {
					if (removedNodes.length) {
						program.node.body.push(
							t.exportNamedDeclaration(
								t.variableDeclaration("const", [
									t.variableDeclarator(
										t.identifier("$useSSD$"),
										t.arrayExpression(removedNodes),
									),
								]),
							),
						);
					}
				},
			},
		},
	};
}
