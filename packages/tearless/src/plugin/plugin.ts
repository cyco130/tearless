import { PluginOption } from "vite";
import glob from "fast-glob";
import micromatch from "micromatch";
import path from "path";
import { transformAsync } from "@babel/core";
import { babelStripServerSidePlugin } from "./strip-server-side-code";

const { matcher } = micromatch;

export interface TearlessOptions {
	pages?: {
		directory?: string;
		extensions?: string[];
	};
}

export default function tearlessPagesPlugin(
	options: TearlessOptions = {},
): PluginOption[] {
	const { directory = ".", extensions = ["page.tsx"] } = options.pages || {};

	let pagesDir: string;
	let pattern: string;
	let matcherFn: (path: string) => boolean;

	return [
		{
			name: "tearless:pages",

			enforce: "pre",

			configResolved(config) {
				pagesDir = path.resolve(config.root, directory);
				pattern = `**/*.(${extensions.join("|")})`;
				matcherFn = matcher(path.resolve(pagesDir, pattern));
			},

			configureServer(server) {
				server.watcher.on("all", (event, filePath) => {
					if (event === "add" || (event === "unlink" && matcherFn(filePath))) {
						const module = server.moduleGraph.getModuleById("tearless/pages");
						if (module) {
							server.moduleGraph.invalidateModule(module);
						}
					}
				});
			},

			resolveId(id) {
				if (id === "tearless/pages") {
					return id;
				}

				if (["tearless", "tearless/server", "tearless/client"].includes(id)) {
					const files = {
						"tearless": "index.ts",
						"tearless/client": "client.tsx",
						"tearless/server": "server.ts",
					};

					const file = files[id as keyof typeof files];

					return path.resolve(__dirname, "../src/raw", file);
				}
			},

			async load(id) {
				if (id === "tearless/pages") {
					const files = await glob(path.join(pagesDir, pattern));
					const paths = files.map(
						(file) => "/" + path.relative(pagesDir, file),
					);
					const code = createRouteImporterModule(
						paths,
						extensions,
						"/" + directory,
					);

					return code;
				}
			},
		},

		{
			name: "tearless:transform",

			enforce: "post",

			config() {
				return {
					ssr: {
						noExternal: ["tearless"],
					},
				} as any;
			},

			async resolveId(id, importer, opt) {
				const resolved = await this.resolve(id, importer, {
					...opt,
					skipSelf: true,
				});

				if (resolved && matcherFn(resolved.id)) {
					return resolved;
				}
			},

			async transform(code, id, options) {
				if (options?.ssr || !matcherFn(id)) return;

				// Parse with babel
				const result = await transformAsync(code, {
					filename: id,
					code: true,
					plugins: [babelStripServerSidePlugin],
				});

				if (result) {
					return result.code;
				} else {
					this.warn(`[tearless]: Failed to transform ${id}`);
					return code;
				}
			},
		},
	];
}

export function createCommonPrefixTree<T>(
	elements: [path: string, value: T][],
) {
	const tree: any = {};

	for (const [path, value] of elements) {
		let node = tree;
		for (const part of path.split("/").filter(Boolean)) {
			if (part.startsWith("[...") && part.endsWith("]")) {
				const name = part.slice(4, -1);
				node = node["**"] = node["**"] || { "..": name };
			} else if (part.startsWith("[") && part.endsWith("]")) {
				const name = part.slice(1, -1);
				node = node["*"] = node["*"] || { "..": name };
			} else {
				if (!node[part]) {
					node[part] = {};
				}
				node = node[part];
			}
		}

		node["."] = value;
	}

	return tree;
}

export function createRouteImporterModule(
	routes: string[],
	extensions: string[],
	prefix: string = "",
) {
	const exts = extensions
		.map((ext) => "." + ext)
		.sort((a, b) => b.length - a.length);

	const paths = routes.map((route) => {
		const ext = exts.find((ext) => route.endsWith(ext))!;
		let path = route.slice(0, -ext.length);
		if (path.endsWith("/index")) {
			path = path.slice(0, -6);
		}

		return [path, prefix + route] as [string, string];
	});

	const tree = createCommonPrefixTree(paths);

	let code = `const tree = {\n`;

	function visit(node: any, depth = 1) {
		for (const key of Object.keys(node).sort()) {
			if (key === ".") {
				const name = JSON.stringify(node["."]);
				code +=
					Array(depth + 1).join("  ") +
					`".": [${name}, () => import(${name})],\n`;
			} else if (key === "..") {
				code +=
					Array(depth + 1).join("  ") +
					`"..": ${JSON.stringify(node[".."])},\n`;
			} else {
				code += Array(depth + 1).join("  ") + `"${key}": {\n`;
				visit(node[key], depth + 1);
				code += Array(depth + 1).join("  ") + "},\n";
			}
		}
	}

	visit(tree);

	code += "};\nexport default tree;\n";

	return code;
}
