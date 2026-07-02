import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import HomePage from "./pages/home";
import DashboardPage from "./pages/dashboard";
import LoginPage from "./pages/login";
import UnauthorizedPage from "./pages/unauthorized";
import { AuthGuard } from "./components/guards/AuthGuard";
import { RoleGuard } from "./components/guards/RoleGuard";
import { OwnerGuard } from "./components/guards/OwnerGuard";
import { MainLayout } from "./components/layout/MainLayout";
import { TenantLayout } from "./components/layout/TenantLayout";

import VenuesPage from "./pages/admin/VenuesPage";
import BookingsPage from "./pages/admin/BookingsPage";
import OwnersPage from "./pages/admin/OwnersPage";
import TeamPage from "./pages/superadmin/TeamPage";
import UsersPage from "./pages/admin/UsersPage";
import VenueSelectorPage from "./pages/owner/VenueSelectorPage";
import ReportsPage from "./pages/owner/ReportsPage";
import OwnerBookingsPage from "./pages/owner/OwnerBookingsPage";
import CalendarPage from "./pages/owner/CalendarPage";

export function AppRouter() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<HomePage />} />
				<Route path="/login" element={<LoginPage />} />
				<Route path="/unauthorized" element={<UnauthorizedPage />} />

				{/* Protected routes */}
				<Route path="/dashboard" element={<AuthGuard />}>
					<Route element={<MainLayout />}>
						
						{/* Owner routes */}
						<Route element={<RoleGuard allowedRoles={['owner']} />}>
							<Route path="select-venue" element={<VenueSelectorPage />} />
							<Route path="venue/:venueId" element={<TenantLayout />}>
								<Route index element={<Navigate to="reports" replace />} />
								<Route path="reports" element={<ReportsPage />} />
								<Route path="bookings" element={<OwnerBookingsPage />} />
								<Route path="calendar" element={<CalendarPage />} />
							</Route>
						</Route>

						{/* Admin & SuperAdmin routes */}
						<Route element={<RoleGuard allowedRoles={['admin', 'superAdmin']} />}>
							<Route path="venues" element={<VenuesPage />} />
							<Route path="bookings" element={<BookingsPage />} />
							<Route path="owners" element={<OwnersPage />} />
							<Route element={<RoleGuard allowedRoles={['superAdmin']} />}>
								<Route path="team" element={<TeamPage />} />
								<Route path="users" element={<UsersPage />} />
							</Route>
						</Route>

						{/* Dashboard Index / Redirect logic */}
						<Route element={<OwnerGuard />}>
							<Route index element={<DashboardPage />} />
						</Route>
					</Route>
				</Route>

				<Route path="*" element={<Navigate to="/not-found" replace />} />
			</Routes>
		</BrowserRouter>
	);
}
