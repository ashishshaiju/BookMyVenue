import { axiosInstance } from '@/config/axios';

export interface ReviewDTO {
  rating?: number;
  comment?: string;
}

export interface UpdateReviewDTO {
  rating?: number;
  comment?: string;
}

export interface Review {
  _id: string;
  venueId: string;
  user: {
    id: string;
    userName: string;
    isVerified?: boolean;
  };
  rating?: number;
  comment?: string;
  createdAt: string;
  editedAt?: string;
  reviewerRating?: number;
  ownerReply?: {
    text: string;
    repliedAt: string;
  };
}

export interface ReviewsResponse {
  reviews: Review[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export async function getVenueReviews(
  venueId: string,
  page: number = 1,
  limit: number = 10
): Promise<ReviewsResponse> {
  const { data } = await axiosInstance.get(`/reviews/venue/${venueId}?page=${page}&limit=${limit}`);

  interface ReviewRaw {
    userId?: { _id?: string; id?: string; username?: string; userName?: string } | string;
    userName?: string;
    isVerified?: boolean;
    [key: string]: unknown;
  }

  const reviews = data.data.reviews.map((r: ReviewRaw) => {
    const userIdObj = typeof r.userId === 'object' && r.userId !== null ? r.userId : null;
    return {
      ...r,
      user: {
        id: userIdObj?._id || userIdObj?.id || r.userId,
        userName: userIdObj?.username || userIdObj?.userName || r.userName || 'Unknown',
        isVerified: r.isVerified,
      },
    };
  });

  return {
    ...data.data,
    reviews,
  };
}

export async function submitReview(venueId: string, dto: ReviewDTO): Promise<Review> {
  const { data } = await axiosInstance.post(`/reviews/venue/${venueId}`, dto);
  return data.data;
}

export async function getMyRating(venueId: string): Promise<number | null> {
  const { data } = await axiosInstance.get(`/reviews/venue/${venueId}/my-rating`);
  return data.data.rating;
}

export async function updateReview(reviewId: string, dto: UpdateReviewDTO): Promise<Review> {
  const { data } = await axiosInstance.patch(`/reviews/${reviewId}`, dto);
  return data.data;
}

export async function deleteReview(reviewId: string): Promise<void> {
  await axiosInstance.delete(`/reviews/${reviewId}`);
}
