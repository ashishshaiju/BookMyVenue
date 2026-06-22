import { Router } from 'express';
import { validateParams } from '../../middlewares/validation.middleware';
import { venueIdParamSchema } from '../venue/venue.validator';
// import * as controller from './availability.controller';

const router = Router();

router
.route('/:id/availability')
.get(
  validateParams(venueIdParamSchema),
//   controller.getVenueAvailability
);