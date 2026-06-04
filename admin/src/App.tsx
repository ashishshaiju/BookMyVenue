import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./config/queryClient";
import { AppRouter } from "./router";

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<AppRouter />
		</QueryClientProvider>
	);
}

export default App;
