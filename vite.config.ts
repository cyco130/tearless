import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { babelPluginStripServerSide } from "./strip-server-side";
// @ts-expect-error
import xxx from "babel-plugin-minify-dead-code-elimination";

export default defineConfig({
	plugins: [
		react({
			babel: {
				plugins: [babelPluginStripServerSide(), xxx],
			},
			ssrPlugins: [],
		}),
	],
});
