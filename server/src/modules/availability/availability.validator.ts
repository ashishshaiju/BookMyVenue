import { z } from 'zod';

export const availabilityQuerySchema = z.object({
  date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date query parameter must be in YYYY-MM-DD format'),
});

export type AvailabilityQueryDTO = z.infer<typeof availabilityQuerySchema>;
