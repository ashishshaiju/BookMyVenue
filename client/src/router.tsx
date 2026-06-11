import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import HomePage from "./pages/home";
import ExplorePage from "./pages/explore";
import RegisterPage from "./pages/register";
import LoginPage from "./pages/login"
import ForgotPasswordPage from "./pages/forgotPassword"
import ResetPasswordPage from "./pages/resetPassword"
import MainLayout from "./layout/MainLayout";
import ListVenueLayout from "./layout/ListVenueLayout";
import MyVenues from "./pages/listVenue/MyVenues";
import AddVenue from "./pages/listVenue/Addvenue";

export function AppRouter() {
	return (
		<BrowserRouter>
			<Routes>
				 <Route element={<MainLayout />}>
					<Route path="/" element={<HomePage />} />
					<Route path="/explore" element={<ExplorePage />} />
        </Route>

				 <Route path="/list-venue" element={<ListVenueLayout />}>
					<Route path="add-venue" element={<AddVenue />} />
					<Route path="my-venues" element={<MyVenues />} />
					<Route index element={<MyVenues />} />
        </Route>

				
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
