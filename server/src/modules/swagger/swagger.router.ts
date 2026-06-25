import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import swaggerUi from 'swagger-ui-express';
import { openapiDocument } from './swagger.config';
import { swaggerConfig } from '../../constants/env';

const router: Router = Router();

// Only serve Swagger UI in development
function devOnly(_req: Request, res: Response, next: NextFunction): void {
  if (process.env.NODE_ENV !== 'development') {
    res.status(404).json({ message: 'Not found' });
    return;
  }
  next();
}

// Basic Auth guard for the Swagger UI
function basicAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Swagger UI"');
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  const base64 = authHeader.slice('Basic '.length);
  const decoded = Buffer.from(base64, 'base64').toString('utf8');
  const [user, ...rest] = decoded.split(':');
  const pass = rest.join(':');

  if (user !== swaggerConfig.user || pass !== swaggerConfig.pass) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Swagger UI"');
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }

  next();
}

// Expose the raw OpenAPI JSON for Postman / import
router.get('/json', devOnly, basicAuth, (_req, res) => {
  res.json(openapiDocument);
});

// Mount the Swagger UI
router.use('/', devOnly, basicAuth, swaggerUi.serve);
router.get('/', devOnly, basicAuth, swaggerUi.setup(openapiDocument, {
  customSiteTitle: 'BookMyVenue API Docs',
  swaggerOptions: {
    persistAuthorization: true,
    filter: true,
    displayRequestDuration: true,
  },
}));

export { router as swaggerRouter };
