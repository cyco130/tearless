import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import babelPluginStripServerSide from "./strip-server-side";

export default defineConfig({
	plugins: [
		react({
			// Uncomment out if you don't have: https://github.com/vitejs/vite/pull/6238
			babel: {
				plugins: [babelPluginStripServerSide()],
			},
			ssrPlugins: [],
		}),
	],
});
