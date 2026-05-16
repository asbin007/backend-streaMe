import { SignOptions } from 'jsonwebtoken';

export interface JwtPayload {
  id: number | string;
  role?: string;
}

export function getJwtSecret(): string {
  const secret = process.env.WT_SECRET_KEY;

  if (!secret || secret === 'default_secret') {
    throw new Error('WT_SECRET_KEY must be set to a strong secret');
  }

  return secret;
}

export function getJwtExpiresIn(): SignOptions['expiresIn'] {
  return (process.env.JWT_EXPIRE_IN || '24h') as SignOptions['expiresIn'];
}

export function normalizeEmail(email: unknown): string {
  return String(email || '').trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
