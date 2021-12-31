import { render } from "react-dom";
import { App } from "./App";
import { QueryClient, QueryClientProvider } from "react-query";

const queryClient = new QueryClient();
const root = document.getElementById("root");
render(
	<QueryClientProvider client={queryClient}>
		<App filename="package.json" />
	</QueryClientProvider>,
	root,
);
