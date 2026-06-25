import { useEffect } from 'react';
import { showError } from '@/utils/toast';

// Listens to global interceptor events and displays toast notifications.
export function ToastListener() {
  useEffect(() => {
    const handleLogout = (event: CustomEvent<{ message: string }>) => {
      showError(event.detail?.message || 'Session expired. Please log in again.');
    };

    const handleForbidden = (event: CustomEvent<{ message: string }>) => {
      showError(event.detail?.message || "You don't have permission to perform this action.");
    };

    window.addEventListener('auth:logout', handleLogout as EventListener);
    window.addEventListener('auth:forbidden', handleForbidden as EventListener);

    return () => {
      window.removeEventListener('auth:logout', handleLogout as EventListener);
      window.removeEventListener('auth:forbidden', handleForbidden as EventListener);
    };
  }, []);

  return null;
}
