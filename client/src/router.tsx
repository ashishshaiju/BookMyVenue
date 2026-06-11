import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import HomePage from "./pages/home";
import ExplorePage from "./pages/explore";
import RegisterPage from "./pages/register";
import LoginPage from "./pages/login"
import ForgotPasswordPage from "./pages/forgotPassword"
import ResetPasswordPage from "./pages/resetPassword"
import MainLayout from "./layout/MainLayout";
import ListVenue from "./pages/listVenue"
import AuthGuard from "./components/common/AuthGuard";
import GuestGuard from "./components/common/GuestGuard";

export function AppRouter() {
	return (
		<BrowserRouter>
			<Routes>
				{/* Public Layout Routes */}
				<Route element={<MainLayout />}>
					<Route path="/" element={<HomePage />} />
					<Route path="/explore" element={<ExplorePage />} />
				</Route>

				{/* Guest-only Routes */}
				<Route element={<GuestGuard />}>
					<Route path="/register" element={<RegisterPage />} />
					<Route path="/login" element={<LoginPage />} />
					<Route path="/forgot-password" element={<ForgotPasswordPage />} />
					<Route path="/reset-password" element={<ResetPasswordPage />} />
				</Route>

				{/* Protected Routes */}
				<Route element={<AuthGuard />}>
					<Route path="/list-venue" element={<ListVenue />} />
				</Route>

				<Route path="*" element={<Navigate to="/not-found" replace />} />
			</Routes>
		</BrowserRouter>
	);
}
