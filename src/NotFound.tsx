import { definePage } from "./tearless";
import { Nav } from "./Nav";

export default function NotFound() {
	return (
		<main>
			<h1>404</h1>
			<Nav />
			<p>Page not found!</p>
		</main>
	);
}
