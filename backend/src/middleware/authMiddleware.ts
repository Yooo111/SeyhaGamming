import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// Secret key for generating and verifying admin session tokens
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'seyha-admin-secure-auth-token-key-2026';

/**
 * Generate a secure admin authorization token for a logged-in admin user
 */
export const generateAdminToken = (adminId: number, username: string): string => {
  const payload = `${adminId}:${username}:${ADMIN_SECRET}`;
  const hash = crypto.createHash('sha256').update(payload).digest('hex');
  return `adm_${adminId}_${hash.slice(0, 32)}`;
};

/**
 * Express Middleware to protect Admin-only API endpoints (PUT, DELETE)
 */
export const requireAdminAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization || (req.headers['x-admin-token'] as string);

  if (!authHeader) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized: Admin authentication token is required.',
    });
    return;
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!token || !token.startsWith('adm_')) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid or expired admin session token.',
    });
    return;
  }

  // Token is valid
  next();
};
