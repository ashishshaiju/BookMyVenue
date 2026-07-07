import type { z } from 'zod';
import type { Request, Response } from 'express';
import { ResponseUtil } from '../../utils/responseUtils';
import * as service from './venue.service';
import * as wishlistRepo from '../wishlist/wishlist.repository';
import type {
  createVenueSchema,
  updateVenueSchema,
  rejectVenueSchema,
  suspendVenueSchema,
  adminVenueFiltersSchema,
  venueIdParamSchema,
  publicVenueFiltersSchema,
  featureVenueSchema,
} from './venue.validator';
import type { IVenue } from './venue.types';
import { handleError } from '../../utils/errors';
import { v2 as cloudinary } from 'cloudinary';
import { PERMISSIONS } from '../../constants/permissions';


// Helpers
function isCallerPrivileged(req: Request): boolean {
  return (
    req.user?.role.isSuperAdmin === true ||
    req.user?.role.permissions?.has(PERMISSIONS.venues.read) === true
  );
}
// function isCallerAdmin(req: Request): boolean {
//   return (
//     req.user?.role.isSuperAdmin === true ||
//     req.user?.role.permissions?.has('approve:venues') === true
//   );
// }

export const getUploadSignature = (req: Request, res: Response): void => {
  try {
    const userId = req.user?.userId;
    if (!userId) { ResponseUtil.unauthorized(res, 'Unauthorized'); return; }

    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

    if (!apiSecret || !cloudName || !apiKey || !uploadPreset) {
      ResponseUtil.internalServerError(res, 'Image upload not configured');
      return;
    }

    const timestamp = Math.round(Date.now() / 1000);
    const folder = `bookmyvenue/venues/${userId}`;

    const paramsToSign = { folder, timestamp, upload_preset: uploadPreset };

    const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

    ResponseUtil.success(res, 'Signature generated', {
      signature, timestamp, cloudName, apiKey, folder, uploadPreset,
    });
  } catch (e) {
    handleError(res, e, 'getUploadSignature');
  }
};

export const getPaginatedActiveVenues = async (req: Request, res: Response): Promise<void> => {
  try {
    const filters = req.validated?.query as z.infer<typeof publicVenueFiltersSchema>;
    const paginationParams = req.pagination ?? { page: 1, limit: 20, skip: 0, sort: '' };
    const venuesData = await service.getPaginatedActiveVenues(paginationParams, filters);

    // Add wishlisted flag for authenticated users (bulk check, not N+1)
    let finalVenues: (IVenue & { wishlisted?: boolean })[] = venuesData.venues;
    if (req.user?.userId) {
      const venueIds = finalVenues.map((v) => v._id.toString());
      const wishlistedIds = await wishlistRepo.getWishlistedVenueIds(req.user.userId, venueIds);
      finalVenues = finalVenues.map((venue) => Object.assign({}, venue, {
        wishlisted: wishlistedIds.has(venue._id.toString()),
      }));
    } else {
      // For unauthenticated users, client will use localStorage
      finalVenues = finalVenues.map((venue) => Object.assign({}, venue, {
        wishlisted: false,
      }));
    }

    ResponseUtil.paginated(res, 'Venues retrieved successfully', finalVenues, venuesData.pagination, 'venues');
  } catch (e) {
    handleError(res, e, 'getPaginatedActiveVenues');
  }
};

export const getVenuePins = async (req: Request, res: Response): Promise<void> => {
  try {
    const { swLng, swLat, neLng, neLat } = req.query;

    // Parse and validate bbox parameters
    const bbox = swLng && swLat && neLng && neLat
      ? {
          swLng: Number(swLng),
          swLat: Number(swLat),
          neLng: Number(neLng),
          neLat: Number(neLat),
        }
      : undefined;

    const pins = await service.getVenuePins(bbox);
    ResponseUtil.success(res, 'Venue pins retrieved successfully', pins);
  } catch (e) {
    handleError(res, e, 'getVenuePins');
  }
};

// Owner Handlers
export const createVenue = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      ResponseUtil.unauthorized(res, 'Unauthorized');
      return;
    }
    const dto = req.validated?.body as z.infer<typeof createVenueSchema>;
    const venue = await service.createVenue(userId, dto);
    ResponseUtil.created(res, 'Venue created successfully', venue);
  } catch (e) {
    handleError(res, e, 'createVenue');
  }
};

export const getMyVenues = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      ResponseUtil.unauthorized(res, 'Unauthorized');
      return;
    }
    const venues = await service.getMyVenues(userId);
    ResponseUtil.success(res, 'Venues retrieved successfully', {
      count: venues.length,
      venues,
    });
  } catch (e) {
    handleError(res, e, 'getMyVenues');
  }
};

// PUT /venues/draft
export const upsertDraft = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) { ResponseUtil.unauthorized(res, 'Unauthorized'); return; }

    const { step, formValues } = req.body as { step: number; formValues: Record<string, unknown> };
    if (typeof step !== "number") {
      ResponseUtil.badRequest(res, 'Invalid draft payload');
      return;
    }

    const draft = await service.upsertDraft(userId, step, formValues);
    ResponseUtil.success(res, 'Draft saved', draft);
  } catch (e) {
    handleError(res, e, 'upsertDraft');
  }
};

// GET /venues/draft
export const getMyDraft = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) { ResponseUtil.unauthorized(res, 'Unauthorized'); return; }

    const draft = await service.getDraft(userId);
    ResponseUtil.success(res, 'Draft retrieved', draft);
  } catch (e) {
    handleError(res, e, 'getMyDraft');
  }
};



export const getVenueById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.validated?.params as z.infer<typeof venueIdParamSchema>;
    const venue = await service.getVenueById(id, req.user?.userId, isCallerPrivileged(req));

    // Add wishlisted flag if user is authenticated
    const venueWithWishlist = {
      ...venue,
      wishlisted: false,
    };

    if (req.user?.userId) {
      venueWithWishlist.wishlisted = await wishlistRepo.isWishlisted(req.user.userId, id);
    }

    ResponseUtil.success(res, 'Venue retrieved successfully', venueWithWishlist);
  } catch (e) {
    handleError(res, e, 'getVenueById');
  }
};

export const updateVenue = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.validated?.params as z.infer<typeof venueIdParamSchema>;
    const userId = req.user?.userId;
    if (!userId) {
      ResponseUtil.unauthorized(res, 'Unauthorized');
      return;
    }
    const dto = req.validated?.body as z.infer<typeof updateVenueSchema>;
    const venue = await service.updateVenue(id, userId, dto);
    ResponseUtil.success(res, 'Venue updated successfully', venue);
  } catch (e) {
    handleError(res, e, 'updateVenue');
  }
};

export const deleteVenue = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.validated?.params as z.infer<typeof venueIdParamSchema>;
    const userId = req.user?.userId;
    if (!userId) {
      ResponseUtil.unauthorized(res, 'Unauthorized');
      return;
    }
    await service.deleteVenue(id, userId);
    ResponseUtil.success(res, 'Venue deleted successfully');
  } catch (e) {
    handleError(res, e, 'deleteVenue');
  }
};

export const submitVenue = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.validated?.params as z.infer<typeof venueIdParamSchema>;
    const userId = req.user?.userId;
    if (!userId) {
      ResponseUtil.unauthorized(res, 'Unauthorized');
      return;
    }
    const venue = await service.submitVenue(id, userId);
    ResponseUtil.success(res, 'Venue submitted for review successfully', venue);
  } catch (e) {
    handleError(res, e, 'submitVenue');
  }
};

// Admin Handlers
export const getPendingVenues = async (_req: Request, res: Response): Promise<void> => {
  try {
    const venues = await service.getPendingVenues();
    ResponseUtil.success(res, 'Pending venues retrieved successfully', {
      count: venues.length,
      venues,
    });
  } catch (e) {
    handleError(res, e, 'getPendingVenues');
  }
};

export const getAllVenues = async (req: Request, res: Response): Promise<void> => {
  try {
    const filters = req.validated?.query as z.infer<typeof adminVenueFiltersSchema>;
    const result = await service.getAllVenues(filters);
    ResponseUtil.success(res, 'Venues retrieved successfully', result);
  } catch (e) {
    handleError(res, e, 'getAllVenues');
  }
};

export const approveVenue = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.validated?.params as z.infer<typeof venueIdParamSchema>;
    const adminId = req.user?.userId;
    if (!adminId) {
      ResponseUtil.unauthorized(res, 'Unauthorized');
      return;
    }
    const venue = await service.approveVenue(id, adminId);
    ResponseUtil.success(res, 'Venue approved successfully', venue);
  } catch (e) {
    handleError(res, e, 'approveVenue');
  }
};

export const rejectVenue = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.validated?.params as z.infer<typeof venueIdParamSchema>;
    const adminId = req.user?.userId;
    if (!adminId) {
      ResponseUtil.unauthorized(res, 'Unauthorized');
      return;
    }
    const dto = req.validated?.body as z.infer<typeof rejectVenueSchema>;
    const venue = await service.rejectVenue(id, adminId, dto);
    ResponseUtil.success(res, 'Venue rejected', venue);
  } catch (e) {
    handleError(res, e, 'rejectVenue');
  }
};

export const unsuspendVenue = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.validated?.params as z.infer<typeof venueIdParamSchema>;
    const adminId = req.user?.userId;
    if (!adminId) {
      ResponseUtil.unauthorized(res, 'Unauthorized');
      return;
    }
    const venue = await service.unsuspendVenue(id, adminId);
    ResponseUtil.success(res, 'Venue reactivated successfully', venue);
  } catch (e) {
    handleError(res, e, 'unsuspendVenue');
  }
};

export const suspendVenue = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.validated?.params as z.infer<typeof venueIdParamSchema>;
    const dto = req.validated?.body as z.infer<typeof suspendVenueSchema>;
    const adminId = req.user?.userId;
    if (!adminId) {
      ResponseUtil.unauthorized(res, 'Unauthorized');
      return;
    }
    const venue = await service.suspendVenue(id, adminId, dto);
    ResponseUtil.success(res, 'Venue suspended successfully', venue);
  } catch (e) {
    handleError(res, e, 'suspendVenue');
  }
};

export const featureVenue = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.validated?.params as z.infer<typeof venueIdParamSchema>;
    const adminId = req.user?.userId;
    if (!adminId) {
      ResponseUtil.unauthorized(res, 'Unauthorized');
      return;
    }
    const dto = req.validated?.body as z.infer<typeof featureVenueSchema>;
    await service.featureVenue(id, dto.durationDays === 'indefinite' ? null : parseInt(dto.durationDays, 10));
    ResponseUtil.success(res, 'Venue featured status updated successfully');
  } catch (e) {
    handleError(res, e, 'featureVenue');
  }
};

export const getFeaturedVenues = async (req: Request, res: Response): Promise<void> => {
  try {
    const venues = await service.getFeaturedVenues();
    
    let finalVenues: (IVenue & { wishlisted?: boolean; featuredExpiresAt?: Date | null })[] = venues;
    if (req.user?.userId) {
      const venueIds = venues.map((v) => v._id.toString());
      const wishlistedIds = await wishlistRepo.getWishlistedVenueIds(req.user.userId, venueIds);
      finalVenues = venues.map((venue) => Object.assign({}, venue, {
        wishlisted: wishlistedIds.has(venue._id.toString()),
        featuredExpiresAt: venue.featuredExpiresAt,
      }));
    } else {
      finalVenues = venues.map((venue) => Object.assign({}, venue, {
        wishlisted: false,
        featuredExpiresAt: venue.featuredExpiresAt,
      }));
    }
    
    ResponseUtil.success(res, 'Featured venues retrieved successfully', finalVenues);
  } catch (e) {
    handleError(res, e, 'getFeaturedVenues');
  }
};

export const unfeatureVenue = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.validated?.params as z.infer<typeof venueIdParamSchema>;
    const adminId = req.user?.userId;
    if (!adminId) {
      ResponseUtil.unauthorized(res, 'Unauthorized');
      return;
    }
    await service.unfeatureVenue(id);
    ResponseUtil.success(res, 'Venue removed from featured successfully');
  } catch (e) {
    handleError(res, e, 'unfeatureVenue');
  }
};
