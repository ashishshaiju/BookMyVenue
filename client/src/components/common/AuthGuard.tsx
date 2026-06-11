import React, { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";

const AuthGuard: React.FC = () => {
  const { isAuthenticated, loading, verifySession } = useAuth();
  const toast = useToast();
  const [checking, setChecking] = useState(true);
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    if (isAuthenticated) {
      setChecking(false);
      return;
    }

    const performCheck = async () => {
      try {
        await verifySession();
      } catch (err) {
        toast.error("Session expired. Please log in again.");
      } finally {
        setChecking(false);
      }
    };
    performCheck();
  }, [location.pathname, loading]);

  if (loading || checking) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-[#1c1c1c] text-[#f2f2f2]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default AuthGuard;
