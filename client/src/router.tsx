import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import HomePage from './pages/home';
import ExplorePage from './pages/explore';
import RegisterPage from './pages/register';
import LoginPage from './pages/login';
import ForgotPasswordPage from './pages/forgotPassword';
import ResetPasswordPage from './pages/resetPassword';
import MainLayout from './layout/MainLayout';
import ListVenueLayout from './pages/listVenue/ListVenueLayout';
import MyVenues from './pages/listVenue/myVenue';
import AddVenue from './pages/listVenue/addVenue';
import AuthGuard from './components/common/AuthGuard';
import GuestGuard from './components/common/GuestGuard';
import VenueDetails from './pages/venueDetails';
import BookingSummary from './pages/booking/summary';
import BookingConfirmation from './pages/booking/confirmation';
import MyBookingsPage from './pages/myBookings';
import BookingDetailsPage from './pages/bookingDetails';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Layout Routes */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="venue/:id" element={<VenueDetails />} />
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
          <Route element={<MainLayout />}>
            <Route path="/booking/summary" element={<BookingSummary />} />
            <Route path="/booking/confirmation" element={<BookingConfirmation />} />
            <Route path="/my-bookings" element={<MyBookingsPage />} />
            <Route path="/my-bookings/:bookingId" element={<BookingDetailsPage />} />
          </Route>

          <Route path="/list-venue" element={<ListVenueLayout />}>
            <Route path="add-venue" element={<AddVenue />} />
            <Route path="my-venues" element={<MyVenues />} />
            <Route index element={<MyVenues />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/not-found" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
