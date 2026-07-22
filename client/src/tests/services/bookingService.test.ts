import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getMyBookings, getBookingById, saveBookerDetails, cancelBooking } from '@/services/bookingService';
import { axiosInstance as api } from '@/config/axios';
import { API_ENDPOINTS } from '@/constants';

vi.mock('@/config/axios', () => ({
  axiosInstance: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('client bookingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch user bookings via getMyBookings', async () => {
    const mockData = {
      success: true,
      data: {
        bookings: { upcoming: [], completed: [], cancelled: [] },
      },
    };

    vi.mocked(api.get).mockResolvedValueOnce({ data: mockData });

    const response = await getMyBookings();

    expect(api.get).toHaveBeenCalledWith(API_ENDPOINTS.MY_BOOKINGS);
    expect(response).toEqual(mockData);
  });

  it('should fetch booking by ID via getBookingById', async () => {
    const mockBooking = {
      success: true,
      data: { bookingRefId: 'BMV-123456' },
    };

    vi.mocked(api.get).mockResolvedValueOnce({ data: mockBooking });

    const response = await getBookingById('BMV-123456');

    expect(api.get).toHaveBeenCalledWith(API_ENDPOINTS.BOOKING_BY_ID('BMV-123456'));
    expect(response).toEqual(mockBooking);
  });

  it('should send formatted payload to saveBookerDetails', async () => {
    vi.mocked(api.patch).mockResolvedValueOnce({ data: { success: true, data: null } });

    await saveBookerDetails({
      lockId: 'lock_123',
      guestCount: 150,
      eventType: 'Wedding Reception',
      name: 'John Doe',
      phone: '9876543210',
      email: 'john@example.com',
      place: 'Kochi',
    });

    expect(api.patch).toHaveBeenCalledWith(API_ENDPOINTS.SAVE_BOOKER_DETAILS, {
      lockId: 'lock_123',
      guestCount: 150,
      eventType: 'Wedding Reception',
      bookerInfo: {
        name: 'John Doe',
        phone: '9876543210',
        email: 'john@example.com',
        place: 'Kochi',
      },
    });
  });

  it('should cancel booking via cancelBooking with reason', async () => {
    vi.mocked(api.delete).mockResolvedValueOnce({
      data: { success: true, data: { refundAmount: 1000 } },
    });

    const response = await cancelBooking('bk_123', 'Change of plans');

    expect(api.delete).toHaveBeenCalledWith(API_ENDPOINTS.CANCEL_BOOKING('bk_123'), {
      data: { reason: 'Change of plans' },
    });
    expect(response.success).toBe(true);
  });
});
