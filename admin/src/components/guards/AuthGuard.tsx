import { Navigate, Outlet } from 'react-router';
import { Loader2 } from 'lucide-react';
import { useApiQuery } from '../../hooks/useApi';
import { QUERY_KEYS } from '../../config/queryKeys';
import { API_ENDPOINTS } from '../../constants';

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'superAdmin';
  avatar?: string;
}

export function AuthGuard() {
  const { data: profile, isLoading, isError } = useApiQuery<UserProfile>(
    QUERY_KEYS.PROFILE,
    { method: 'GET', url: API_ENDPOINTS.PROFILE },
    { staleTime: 5 * 60 * 1000 }
  );

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg-primary)]">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (isError || !profile) {
    return <Navigate to="/login" replace />;
  }

  if (profile.role !== 'owner' && profile.role !== 'admin' && profile.role !== 'superAdmin') {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
