import { definePage } from "./tearless";
import fs from "fs";

export default definePage(
	async function get() {
		return await fs.promises.readFile("package.json", "utf8");
	},

	({ data }) => (
		<div>
			<h1>Contents of package.json</h1>
			<pre>{JSON.stringify(data, null, 2)}</pre>
		</div>
	),
);

async function read() {
	return reread();
}

async function reread() {
	return fs.promises.readFile("package.json", "utf8");
}
