import { defineRoute } from "./tearless";
import { Nav } from "./Nav";

export default defineRoute(
	async function get() {
		return "about data";
	},

	function AboutPage({ data }) {
		return (
			<main>
				<h1>About</h1>
				<Nav />
				<p>This is the about page!</p>
				<h2>Data</h2>
				<pre>{JSON.stringify(data, null, 2)}</pre>
			</main>
		);
	},
);
