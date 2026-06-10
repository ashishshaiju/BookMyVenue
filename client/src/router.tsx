import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import HomePage from "./pages/home";
import ExplorePage from "./pages/explore";
import RegisterPage from "./pages/register";
import LoginPage from "./pages/login"
import ForgotPasswordPage from "./pages/forgotPassword"
import ResetPasswordPage from "./pages/resetPassword"
import MainLayout from "./layout/MainLayout";
import ListVenue from "./pages/listVenue"

export function AppRouter() {
	return (
		<BrowserRouter>
			<Routes>
				 <Route element={<MainLayout />}>
					<Route path="/" element={<HomePage />} />
					<Route path="/explore" element={<ExplorePage />} />
        </Route>

				<Route path="/list-venue" element={<ListVenue />} />
				
				<Route path="/register" element={<RegisterPage />} />
				<Route path="/login" element={<LoginPage />} />
				<Route path="/forgot-password" element={<ForgotPasswordPage />} />

				{/* link give in  email , also token needed */}
				<Route path="/reset-password" element={<ResetPasswordPage />} />

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
