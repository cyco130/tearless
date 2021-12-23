import { definePage } from "./tearless";
import fs from "fs";
import { useState } from "react";

export default definePage(
	{
		get: readData,

		async increment() {
			const value = await readData();
			await writeData(value + 1);
			return value + 1;
		},
	},

	({ data, methods }) => {
		const [value, setValue] = useState(data);

		return (
			<div>
				<pre>{value}</pre>
				<p>
					<button
						onClick={async () => {
							console.log("Incrementing");
							setValue(await methods.increment());
						}}
					>
						Increment
					</button>
				</p>
			</div>
		);
	},

	"CounterPage",
);

async function readData(): Promise<number> {
	try {
		const contents = await fs.promises.readFile("data.json", "utf-8");
		const parsed = JSON.parse(contents);
		return Number(parsed.value);
	} catch {
		return 0;
	}
}

async function writeData(value: number): Promise<void> {
	await fs.promises.writeFile("data.json", JSON.stringify({ value }));
}
