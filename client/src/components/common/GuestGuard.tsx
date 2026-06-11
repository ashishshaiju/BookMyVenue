import React from "react";
import { Navigate, Outlet } from "react-router";
import { useAuth } from "../../hooks/useAuth";

const GuestGuard: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-[#1c1c1c] text-[#f2f2f2]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />;
};

export default GuestGuard;
