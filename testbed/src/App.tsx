import React from "react";
import { useServerSideData } from "tearless";
import fs from "fs";

interface AppProps {
	filename: string;
}

export const App: React.FC<AppProps> = ({ filename }) => {
	const result = useServerSideData(async () =>
		fs.promises.readFile(filename, "utf8"),
	);

	return (
		<main>
			<p>The following is fetched on the server-side:</p>
			<pre>{result.data}</pre>
		</main>
	);
};
