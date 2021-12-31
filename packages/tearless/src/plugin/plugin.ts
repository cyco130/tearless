import { PluginOption } from "vite";
import path from "path";
import { promises as fs } from "fs";
import { transformAsync } from "@babel/core";
import { babelTransformServerSideHooks } from "./transform-server-side";
import { babelTransformClientSideHooks } from "./transform-client-side";

export default function tearlessPagesPlugin(): PluginOption[] {
	let idCounter = 0;
	let moduleIdMap: Record<string, string> = {};
	let root: string;
	let dev: boolean;
	let ssrBuild: boolean;
	let clientOutDir: string;

	return [
		{
			name: "tearless:manifest",

			enforce: "pre",

			config() {
				return {
					ssr: {
						noExternal: ["@tearless/manifest"],
					},
				} as any;
			},

			resolveId(id) {
				if (id === "@tearless/manifest") {
					return id;
				}
			},

			async load(id) {
				if (id === "@tearless/manifest") {
					if (dev) {
						return `export default new Proxy({}, { get: (_, name) => () => import("/" + name) });`;
					} else {
						const manifest = await fs.readFile(
							path.resolve(root, clientOutDir, "tearless-manifest.json"),
							"utf8",
						);

						let code = "export default {";

						for (const [filePath, moduleId] of Object.entries(
							JSON.parse(manifest),
						)) {
							code += `\n\t${JSON.stringify(
								moduleId,
							)}: () => import(${JSON.stringify("/" + filePath)}),`;
						}

						code += "\n};";
						return code;
					}
				}
			},
		},
		{
			name: "tearless:transform",

			enforce: "post",

			config() {
				return {
					resolve: {
						dedupe: ["react-query"],
					},
				};
			},

			configResolved(config) {
				clientOutDir = (config as any).vavite.clientOutDir;
				root = config.root;
				dev = config.command === "serve";
				ssrBuild = !dev && !!config.build.ssr;
			},

			async transform(code, id, options) {
				if (
					!id.startsWith(root) ||
					(!code.includes(`"tearless"`) && !code.includes(`'tearless'`)) ||
					(!code.includes("useServerSideData") && !code.includes("useSSD"))
				) {
					return;
				}

				let moduleId: string;
				if (dev) {
					moduleId = id.slice(root.length + 1);
				} else {
					moduleId = (idCounter++).toString(36);
				}

				const ref = { current: false };

				// Parse with babel
				const result = await transformAsync(code, {
					filename: id,
					code: true,
					plugins: [
						options?.ssr
							? babelTransformServerSideHooks()
							: babelTransformClientSideHooks(moduleId, ref),
					],
				});

				if (ref.current) {
					moduleIdMap[id] = moduleId;
				}

				if (result) {
					return result.code;
				} else {
					this.warn(`[tearless]: Failed to transform ${id}`);
					return code;
				}
			},

			async closeBundle() {
				if (!dev && !ssrBuild) {
					fs.writeFile(
						path.resolve(root, clientOutDir, "tearless-manifest.json"),
						JSON.stringify(moduleIdMap),
					);
				}
			},
		},
	];
}
