import type { Request, Response } from 'express';
import { VenueModel } from '../venue/venue.model';
import { fetchActiveConflicts } from '../booking/booking.repository';
import { generateAvailability } from './availability.workflow';
import { ResponseUtil } from '../../utils/responseUtils';
import { logError } from '../../utils/logger';
import type { VenueIdParamDTO } from '../booking/booking.validator';
import type { AvailabilityQueryDTO } from './availability.validator';

export const getVenueAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = req.validated;
    if (!validated?.params || !validated.query) {
      ResponseUtil.badRequest(res, 'Validation failed');
      return;
    }
    
    const { id } = validated.params as VenueIdParamDTO;
    const { date } = validated.query as AvailabilityQueryDTO;

    const venue = await VenueModel.findById(id).lean();
    if (!venue) {
       ResponseUtil.notFound(res, 'Venue not found');
      return;
    }

    // Fetch active conflicts (Bookings and locks)
    const conflicts = await fetchActiveConflicts(id, date);

    // Calculate availability data
    const availabilityData = generateAvailability(venue, date, conflicts);
    ResponseUtil.success(res, 'Availability calculated successfully', availabilityData);
    return;
  } catch (error) {
    logError('Error computing availability', error as Record<string,unknown>);
    ResponseUtil.serverUnavailable(res, 'Failed to compute availability');
    return;
  }
};