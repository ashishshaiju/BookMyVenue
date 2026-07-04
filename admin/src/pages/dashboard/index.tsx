import { Navigate } from 'react-router';
import { useApiQuery } from '../../hooks/useApi';
import { QUERY_KEYS } from '../../config/queryKeys';
import { API_ENDPOINTS } from '../../constants';
import type { UserProfile } from '../../components/guards/AuthGuard';

const DashboardPage = () => {
  const { data: profile } = useApiQuery<UserProfile>(
    QUERY_KEYS.PROFILE,
    { method: 'GET', url: API_ENDPOINTS.PROFILE },
    { staleTime: 5 * 60 * 1000 }
  );

  if (profile?.role === 'admin' || profile?.role === 'superAdmin') {
    return <Navigate to="/dashboard/bookings" replace />;
  }

  return (
    <div>
      <h1>Dashboard</h1>
    </div>
  );
};

export default DashboardPage;
