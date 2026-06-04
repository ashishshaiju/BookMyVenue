import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import HomePage from "./pages/home";
import SearchPage from "./pages/search";

export function AppRouter() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<HomePage />} />
				<Route path="/search" element={<SearchPage />} />

				{/* <Route path="/login" element={<Login />} /> */}

				{/* Protected routes */}
				{/* <Route element={<AuthGuard />}>
					<Route path="/profile" element={<Profile />} />
					<Route path="/orders" element={<Orders />} />
				</Route> */}

				<Route path="*" element={<Navigate to="/not-found" replace />} />
			</Routes>
		</BrowserRouter>
	);
}
