import { axiosInstance } from '@/config/axios';

export interface WishlistResponse {
  wishlisted: boolean;
}

export interface WishlistStatusResponse {
  [venueId: string]: boolean;
}

export async function toggleWishlist(venueId: string): Promise<WishlistResponse> {
  const { data } = await axiosInstance.post<{ data: WishlistResponse }>(
    `/wishlist/toggle/${venueId}`
  );
  return data.data;
}

export async function getMyWishlist(page: number = 1, limit: number = 20) {
  const { data } = await axiosInstance.get('/wishlist', {
    params: { page, limit },
  });
  return data;
}

export async function getWishlistStatus(venueIds: string[]): Promise<WishlistStatusResponse> {
  if (!venueIds.length) return {};

  const { data } = await axiosInstance.get<{ data: WishlistStatusResponse }>('/wishlist/status', {
    params: {
      venueIds: venueIds.join(','),
    },
  });
  return data.data;
}

export async function syncWishlist(venueIds: string[]): Promise<WishlistStatusResponse> {
  if (!venueIds.length) return {};

  const { data } = await axiosInstance.post<{ data: WishlistStatusResponse }>('/wishlist/sync', {
    venueIds,
  });
  return data.data;
}
