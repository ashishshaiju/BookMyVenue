import { useEffect } from "react";
import { showError } from "../../utils/toast";

/**
 * Listens to global custom events dispatched by the axios interceptor
 * (e.g., auth:logout, auth:forbidden) and displays toast notifications.
 *
 * Renders nothing — purely a side-effect listener.
 */
export function ToastListener() {
  useEffect(() => {
    const handleLogout = (event: CustomEvent<{ message: string }>) => {
      showError(event.detail?.message || "Session expired. Please log in again.");
    };

    const handleForbidden = (event: CustomEvent<{ message: string }>) => {
      showError(event.detail?.message || "You don't have permission to perform this action.");
    };

    window.addEventListener("auth:logout", handleLogout as EventListener);
    window.addEventListener("auth:forbidden", handleForbidden as EventListener);

    return () => {
      window.removeEventListener("auth:logout", handleLogout as EventListener);
      window.removeEventListener("auth:forbidden", handleForbidden as EventListener);
    };
  }, []);

  return null;
}
