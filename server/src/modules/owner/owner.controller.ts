import type { z } from 'zod';
import type { Request, Response } from 'express';
import { ResponseUtil } from '../../utils/responseUtils';
import { handleError } from '../../utils/errors';
import type { blockDatesSchema, unblockDatesSchema, offlineBookingSchema } from './owner.validator';
import * as service from './owner.service';
import * as workflow from './owner.workflow';

// GET /api/v1/owner/analytics/:venueId
export const getVenueAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const venueId = req.params.venueId as string;
    const result = await service.getVenueAnalyticsService(venueId);
    ResponseUtil.success(res, 'Analytics retrieved successfully', result);
  } catch (e) {
    handleError(res, e, 'getVenueAnalytics');
  }
};

// GET /api/v1/owner/venue/:venueId/bookings
export const getVenueBookings = async (req: Request, res: Response): Promise<void> => {
  try {
    const venueId = req.params.venueId as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await service.getVenueBookingsService(venueId, page, limit);

    ResponseUtil.success(res, 'Venue bookings retrieved', result);
  } catch (e) {
    handleError(res, e, 'getVenueBookings');
  }
};

// POST /api/v1/owner/bookings/offline
export const createOfflineBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      ResponseUtil.unauthorized(res, 'User not authenticated');
      return;
    }
    const dto = req.validated?.body as z.infer<typeof offlineBookingSchema>;
    
    const result = await service.createOfflineBookingService(req.user.userId, dto);

    ResponseUtil.created(res, 'Offline booking created', result);
  } catch (e) {
    handleError(res, e, 'createOfflineBooking');
  }
};

// GET /api/v1/owner/venue/:venueId/availability-calendar
export const getVenueAvailabilityCalendar = async (req: Request, res: Response): Promise<void> => {
  try {
    const venueId = req.params.venueId as string;

    const result = await workflow.getVenueAvailabilityCalendarWorkflow(venueId);
    if (!result) {
      ResponseUtil.notFound(res, 'Venue not found');
      return;
    }

    ResponseUtil.success(res, 'Availability calendar retrieved', result);
  } catch (e) {
    handleError(res, e, 'getVenueAvailabilityCalendar');
  }
};

// POST /api/v1/owner/:venueId/block-dates
export const blockDates = async (req: Request, res: Response): Promise<void> => {
  try {
    const venueId = req.params.venueId as string;
    const { dates } = req.validated?.body as z.infer<typeof blockDatesSchema>;

    const blockedDates = await service.blockDatesService(venueId, dates);

    ResponseUtil.success(res, 'Dates blocked successfully', blockedDates);
  } catch (e) {
    handleError(res, e, 'blockDates');
  }
};

// POST /api/v1/owner/:venueId/unblock-dates
export const unblockDates = async (req: Request, res: Response): Promise<void> => {
  try {
    const venueId = req.params.venueId as string;
    const { dates } = req.validated?.body as z.infer<typeof unblockDatesSchema>;

    const blockedDates = await service.unblockDatesService(venueId, dates);

    ResponseUtil.success(res, 'Dates unblocked successfully', blockedDates);
  } catch (e) {
    handleError(res, e, 'unblockDates');
  }
};
