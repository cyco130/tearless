import { definePage } from "tearless";
import fs from "fs";
import React from "react";

export default definePage(
	{
		async get() {
			return fs.promises.readFile("data.txt", "utf8");
		},

		async update(newContents: string) {
			await fs.promises.writeFile("data.txt", String(newContents));
			return newContents;
		},
	},

	({ data, methods }) => {
		const [value, setValue] = React.useState(data);

		return (
			<main>
				<p>
					Hello, <b>{data}</b>!
				</p>

				<p>
					<input value={value} onChange={(e) => setValue(e.target.value)} />{" "}
					<button
						onClick={async () => {
							await methods.update(value);
							location.reload();
						}}
					>
						Update
					</button>
				</p>
			</main>
		);
	},
	"HomePage",
);
