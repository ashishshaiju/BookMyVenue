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
import GuestGuard from "./components/common/GuestGuard";
import VenueDetails from "./pages/venueDetails";

export function AppRouter() {
	return (
		<BrowserRouter>
			<Routes>
				{/* Public Layout Routes */}
				<Route element={<MainLayout />}>
					<Route path="/" element={<HomePage />} />
					<Route path="/explore" element={<ExplorePage />} />
					<Route path="venue/:id" element={<VenueDetails />}/>
				</Route>

				<Route path="/list-venue" element={<ListVenueLayout />}>
					<Route path="add-venue" element={<AddVenue />} />
					<Route path="my-venues" element={<MyVenues />} />
					<Route index element={<MyVenues />} />
        </Route>

				{/* Guest-only Routes */}
				<Route element={<GuestGuard />}>
					<Route path="/register" element={<RegisterPage />} />
					<Route path="/login" element={<LoginPage />} />
					<Route path="/forgot-password" element={<ForgotPasswordPage />} />
					<Route path="/reset-password" element={<ResetPasswordPage />} />
				</Route>
		

				<Route path="*" element={<Navigate to="/not-found" replace />} />
			</Routes>
		</BrowserRouter>
	);
}
