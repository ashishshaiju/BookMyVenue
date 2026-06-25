import swaggerJsdoc from 'swagger-jsdoc';
import type { OAS3Definition } from 'swagger-jsdoc';
import path from 'path';

const definition: OAS3Definition = {
  openapi: '3.0.3',
  info: {
    title: 'BookMyVenue API',
    version: '1.0.0',
    description:
      'REST API for the BookMyVenue platform — venue discovery, slot locking, and Razorpay-backed booking flow.',
  },
  servers: [
    {
      url: '/api/v1',
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Access token returned by /auth/login or /auth/refresh',
      },
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'refreshToken',
        description: 'Refresh token cookie used by /auth/refresh and /auth/logout',
      },
    },
    schemas: {
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          data: { type: 'object' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' },
        },
      },
      PaginatedMeta: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          limit: { type: 'integer' },
          total: { type: 'integer' },
          totalPages: { type: 'integer' },
        },
      },
    },
  },
  tags: [
    { name: 'Health', description: 'Server health check' },
    { name: 'Auth', description: 'Authentication and session management' },
    { name: 'User', description: 'Authenticated user profile' },
    { name: 'Venues', description: 'Venue management — public, owner, and admin operations' },
    { name: 'Availability', description: 'Venue availability and slot locking' },
    { name: 'Bookings', description: 'Checkout and payment flow' },
    { name: 'RBAC', description: 'Permission cache management (super-admin only)' },
    { name: 'Webhooks', description: 'Incoming Razorpay payment event handler' },
  ],
};

const options: swaggerJsdoc.Options = {
  definition,
  apis: [
    path.join(process.cwd(), 'src/modules/**/*.routes.ts'),
    path.join(process.cwd(), 'src/modules/**/*.router.ts'),
    path.join(process.cwd(), 'src/router.ts'),
  ],
};

export const openapiDocument = swaggerJsdoc(options);
