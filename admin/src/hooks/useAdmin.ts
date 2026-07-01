import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../services/adminService';
import { QUERY_KEYS } from '../config/queryKeys';

export const useAdminVenues = (page: number, limit?: number, status?: string) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.ADMIN_VENUES, page, limit, status],
    queryFn: () => adminService.getVenues(page, limit, status),
  });
};

export const useApproveVenue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminService.approveVenue(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN_VENUES });
    },
  });
};

export const useRejectVenue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminService.rejectVenue(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN_VENUES });
    },
  });
};

export const useFeatureVenue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, duration }: { id: string; duration: number | null }) => adminService.featureVenue(id, duration),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN_VENUES });
    },
  });
};

export const useActivateVenue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminService.activateVenue(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN_VENUES });
    },
  });
};

export const useDeactivateVenue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminService.deactivateVenue(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN_VENUES });
    },
  });
};

export const useAdminBookings = (page: number, limit?: number) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.ADMIN_BOOKINGS, page, limit],
    queryFn: () => adminService.getBookings(page, limit),
  });
};

export const useAdminOwners = (page: number, limit?: number) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.ADMIN_OWNERS, page, limit],
    queryFn: () => adminService.getOwners(page, limit),
  });
};

export const useSuperAdmins = (page: number, limit?: number) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.SUPER_ADMINS, page, limit],
    queryFn: () => adminService.getAdmins(page, limit),
  });
};

export const usePromoteToAdmin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => adminService.promoteToAdmin(email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SUPER_ADMINS });
    },
  });
};

export const useDemoteAdmin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => adminService.demoteAdmin(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SUPER_ADMINS });
    },
  });
};
