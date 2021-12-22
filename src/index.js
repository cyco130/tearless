// @ts-check
import { createServer as createViteServer } from "vite";
import { createServer as createHttpServer } from "http";
import path from "path";

main().catch((error) => {
	console.error(error);
	process.exit(1);
});

async function main() {
	const viteServer = await createViteServer({
		server: { middlewareMode: "ssr" },
	});

	let { port = 3000, host } = viteServer.config.server;
	if (!host) host = "localhost";
	if (host === true) host = "0.0.0.0";

	const handlerPath = path.resolve(
		viteServer.config.root,
		"src/request-handler.tsx",
	);

	const clientPath =
		"/@fs" + path.resolve(viteServer.config.root, "src/client.tsx");

	const httpServer = createHttpServer(async (req, res) => {
		viteServer.middlewares(req, res, async () => {
			try {
				const { handleRequest } =
					/** @type typeof import("./request-handler") */
					(await viteServer.ssrLoadModule(handlerPath));

				await handleRequest(
					req,
					res,
					clientPath,
					viteServer.transformIndexHtml.bind(viteServer),
				);
			} catch (error) {
				if (error instanceof Error) {
					viteServer.ssrFixStacktrace(error);
				} else {
					error = new Error("Unknown error");
				}

				console.error(error);
				res.statusCode = 500;
				let html = `<!DOCTYPE html><html><head><title>Error</title></head><body><h1>${error.message}</h1><code>${error.stack}</code></body></html>`;

				html = await viteServer.transformIndexHtml(req.url || "/", html);

				res.setHeader("Content-Type", "text/html; charset=utf-8");
				res.end(html);
			}
		});
	});

	httpServer.listen(port, host, () => {
		viteServer.config.logger.info(`Server started at http://${host}:${port}`);
	});
}
