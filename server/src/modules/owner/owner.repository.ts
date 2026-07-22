import { Types } from 'mongoose';
import { BookingModel } from '../booking/models/booking.model';
import { VenueModel } from '../venue/venue.model';
import { BookingStatus } from '../../constants/booking.constants';
import type { IBooking } from '../booking/booking.types';
import type { IVenue } from '../venue/venue.types';

export async function getVenueAnalyticsData(venueId: string): Promise<Record<string, unknown>[]> {
  const pipeline = [
    {
      $match: {
        venueId: new Types.ObjectId(venueId),
        status: BookingStatus.COMPLETED,
      },
    },
    {
      $group: {
        _id: {
          year: { $substrCP: ['$date', 0, 4] },
          month: { $substrCP: ['$date', 5, 2] },
        },
        revenue: { $sum: '$price' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } as Record<string, 1 | -1> },
    {
      $project: {
        _id: 0,
        year: '$_id.year',
        month: '$_id.month',
        revenue: 1,
        count: 1,
      },
    },
  ];

  return BookingModel.aggregate(pipeline);
}

export async function getVenueBookingsPaginated(
  venueId: string,
  skip: number,
  limit: number
): Promise<IBooking[]> {
  return BookingModel.find({ venueId: new Types.ObjectId(venueId) })
    .sort({ date: -1, startTime: -1 })
    .skip(skip)
    .limit(limit)
    .select('date startTime endTime price status bookerInfo paymentMethod createdAt')
    .lean()
    .exec();
}

export async function countVenueBookings(venueId: string): Promise<number> {
  return BookingModel.countDocuments({ venueId: new Types.ObjectId(venueId) });
}

export async function createOfflineBookingRecord(
  venueId: string,
  userId: string,
  date: string,
  startTime: number,
  endTime: number,
  price: number,
  customerName: string,
  phone: string
): Promise<IBooking> {
  return BookingModel.create({
    venueId: new Types.ObjectId(venueId),
    userId: new Types.ObjectId(userId),
    date,
    startTime,
    endTime,
    price,
    paymentReference: `OFFLINE-${Date.now().toString()}`,
    status: BookingStatus.CONFIRMED,
    paymentMethod: 'offline',
    bookerInfo: {
      name: customerName,
      phone: phone,
    },
  });
}

export async function getVenueBlockedDatesAndWorkingDays(venueId: string): Promise<IVenue | null> {
  return VenueModel.findById(venueId).select('blockedDates workingDays temporaryBlockAfterDate inactivity.blockedAfterDate').lean().exec();
}

export async function getConfirmedBookingsAfterDate(
  venueId: string,
  dateThreshold: string
): Promise<IBooking[]> {
  return BookingModel.find({
    venueId: new Types.ObjectId(venueId),
    status: { $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
    date: { $gte: dateThreshold },
  })
    .select('date')
    .lean()
    .exec();
}

export async function findConflictingBookingForDates(
  venueId: string,
  dates: string[]
): Promise<IBooking | null> {
  return BookingModel.findOne({
    venueId: new Types.ObjectId(venueId),
    status: BookingStatus.CONFIRMED,
    date: { $in: dates },
  })
    .lean()
    .exec();
}

export async function addBlockedDatesToVenue(
  venueId: string,
  dates: Date[]
): Promise<IVenue | null> {
  return VenueModel.findByIdAndUpdate(
    venueId,
    {
      $addToSet: {
        blockedDates: { $each: dates },
      },
    },
    { new: true }
  )
    .select('blockedDates')
    .lean()
    .exec();
}

export async function removeBlockedDatesFromVenue(
  venueId: string,
  dates: Date[]
): Promise<IVenue | null> {
  return VenueModel.findByIdAndUpdate(
    venueId,
    {
      $pullAll: {
        blockedDates: dates,
      },
    },
    { new: true }
  )
    .select('blockedDates')
    .lean()
    .exec();
}
