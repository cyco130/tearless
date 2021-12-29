import { defineConfig } from "tsup";

export default defineConfig([
	{
		clean: true,
		entry: { plugin: "src/plugin/plugin.ts" },
		format: ["esm", "cjs"],
		platform: "node",
		target: "node14",
		dts: { entry: { plugin: "src/plugin/plugin.ts" } },
	},
]);
