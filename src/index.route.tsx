import { defineRoute } from "./tearless";
import { Nav } from "./Nav";
import fs from "fs";
import { useState } from "react";

export default defineRoute(
	{
		// This is of course stupid, there are race conditions!

		async get() {
			try {
				const contents = await fs.promises.readFile("data.json");
				const parsed = JSON.parse(contents.toString());
				return Number(parsed.value);
			} catch {
				return 0;
			}
		},

		async increase(by?: number) {
			console.log("Look, I have access to the context!");
			console.log(this.req.socket.remoteAddress);

			let value = 0;
			try {
				const contents = await fs.promises.readFile("data.json");
				const parsed = JSON.parse(contents.toString());
				value = Number(parsed.value);
			} catch {}

			value += by ?? 1;

			await fs.promises.writeFile("data.json", JSON.stringify({ value }));

			return value;
		},

		async decrease(by?: number) {
			let value = 0;
			try {
				const contents = await fs.promises.readFile("data.json");
				const parsed = JSON.parse(contents.toString());
				value = Number(parsed.value);
			} catch {}

			value -= by ?? 1;

			await fs.promises.writeFile("data.json", JSON.stringify({ value }));

			return value;
		},

		async reset() {
			await fs.promises.writeFile("data.json", JSON.stringify({ value: 0 }));
			return 0;
		},
	},

	function View({ data, methods }) {
		const [value, setValue] = useState(data);

		return (
			<div>
				<h1>
					Tearless
					<br />
					<small>Tierless without the tears</small>
				</h1>

				<p>Current value: {value}</p>

				<p>
					<button
						onClick={() => {
							methods.decrease(5).then(setValue);
						}}
					>
						-5
					</button>{" "}
					<button
						onClick={() => {
							methods.decrease().then(setValue);
						}}
					>
						-1
					</button>{" "}
					<button
						onClick={() => {
							methods.reset().then(setValue);
						}}
					>
						Reset
					</button>{" "}
					<button
						onClick={() => {
							methods.increase().then(setValue);
						}}
					>
						+1
					</button>{" "}
					<button
						onClick={() => {
							methods.increase(5).then(setValue);
						}}
					>
						+5
					</button>{" "}
				</p>
			</div>
		);
	},
);
