import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { queryClient } from "./config/queryClient";
import { AuthProvider } from "./context/AuthContext";
import { AppRouter } from "./router";
import { ToastListener } from "./components/common/ToastListener";

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<AuthProvider>
				<AppRouter />
				<Toaster
					position="top-right"
					gutter={8}
					containerStyle={{
						top: 80,
					}}
					toastOptions={{
						duration: 3000,
					}}
				/>
				<ToastListener />
			</AuthProvider>
		</QueryClientProvider>
	);
}

export default App;