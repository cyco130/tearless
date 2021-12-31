import { defineConfig } from "tsup";

export default defineConfig([
	{
		entry: {
			plugin: "src/plugin/plugin.ts",
			"server-impl": "src/lib/server-impl.ts",
		},
		format: ["esm", "cjs"],
		platform: "node",
		target: "node14",
		dts: { entry: { plugin: "src/plugin/plugin.ts" } },
	},
	{
		entry: ["src/lib/client-impl.ts"],
		format: ["esm"],
		platform: "browser",
		target: "esnext",
	},
]);
