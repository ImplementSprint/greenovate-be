import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Allows passing a JWT via the query string for quick mobile testing.
 * Example: https://<ip>:3041/orders/my?access_token=eyJhbGciOi...
 * The middleware copies the token to the Authorization header so existing
 * guards and services continue to work unchanged.
 */
@Injectable()
export class TokenFromQueryMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const token = req.query['access_token'];
    if (typeof token === 'string' && token.length > 0) {
      // Preserve existing header if already present
      if (!req.headers['authorization']) {
        req.headers['authorization'] = `Bearer ${token}`;
      }
    }
    next();
  }
}
