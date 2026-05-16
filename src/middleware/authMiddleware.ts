import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { getJwtSecret, JwtPayload } from '../utils/security';

export interface AuthenticatedRequest extends Express.Request {
  user?: JwtPayload;
}

export const authenticateToken: RequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const [scheme, token] = authHeader?.split(' ') ?? [];

  if (scheme !== 'Bearer' || !token) {
    res.status(401).json({ message: 'Access token required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;
    req.user = decoded as Express.User;
    next();
  } catch (error) {
    res.status(403).json({ message: 'Invalid or expired token' });
  }
};
