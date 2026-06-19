import { axiosInstance } from '../config/axios';
import { API_ENDPOINTS } from '../constants';

export async function createVenue(dto: unknown) {
  const res = await axiosInstance.post(API_ENDPOINTS.VENUES, dto);
  return res.data?.data ?? res.data; // returns the created venue object including _id
}

export async function submitVenue(venueId: string) {
  const res = await axiosInstance.post(API_ENDPOINTS.VENUE_SUBMIT(venueId));
  return res.data?.data ?? res.data;
}

export async function getUploadSignature() {
  const res = await axiosInstance.get(API_ENDPOINTS.UPLOAD_SIGNATURE);
  return res.data?.data ?? res.data;
}
