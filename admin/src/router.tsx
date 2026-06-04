import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import HomePage from "./pages/home";
import DashboardPage from "./pages/dashboard";

export function AppRouter() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<HomePage />} />
				<Route path="/dashboard" element={<DashboardPage />} />

				{/* <Route path="/login" element={<Login />} /> */}

				{/* Protected routes */}
				{/* <Route element={<AuthGuard />}>
					<Route path="/dashboard" element={<Dashboard />} />
				</Route> */}

				<Route path="*" element={<Navigate to="/not-found" replace />} />
			</Routes>
		</BrowserRouter>
	);
}
