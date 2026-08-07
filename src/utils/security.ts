/**
 * The JWT and OTP helpers that used to live here were removed along with the
 * password auth flow — Clerk owns sessions now (see `middleware/clerkAuth.ts`).
 */

export function normalizeEmail(email: unknown): string {
  return String(email || '').trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Escapes interpolated values before they go into an outbound HTML email. */
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
