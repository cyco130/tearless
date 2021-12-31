import { defineConfig } from "vite";
import vavite from "vavite";
import react from "@vitejs/plugin-react";
import tearless from "tearless/plugin";

export default defineConfig({
	root: "src",
	plugins: [vavite(), react(), tearless()],
	build: {
		outDir: "../dist",
		rollupOptions: { input: "client.tsx" },
		emptyOutDir: true,
	},
});
