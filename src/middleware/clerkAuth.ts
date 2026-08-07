import { RequestHandler } from 'express';
import { createClerkClient, verifyToken } from '@clerk/backend';
import NodeCache from 'node-cache';
import { User } from '../models/User';

const secretKey = process.env.CLERK_SECRET_KEY || '';

const clerkClient = createClerkClient({ secretKey });

/**
 * Maps a Clerk user id to the local `users.id`.
 *
 * Without this, every authenticated request would hit Clerk's API to resolve
 * the profile. The mapping is immutable once created, so a long TTL is safe.
 */
const userIdCache = new NodeCache({ stdTTL: 60 * 60, checkperiod: 120 });

export interface AuthContext {
  /** Local `users.id` (UUID). Use this for every foreign key. */
  userId: string;
  /** Clerk's user id (`user_...`). */
  clerkId: string;
  role: 'user' | 'admin' | 'super_admin';
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

/**
 * Origins permitted to mint the tokens we accept. Clerk embeds the requesting
 * origin in the token; checking it stops a token issued for another site from
 * being replayed against this API.
 */
function authorizedParties(): string[] | undefined {
  const raw = [process.env.CLIENT_URL, process.env.CLERK_AUTHORIZED_PARTIES]
    .filter(Boolean)
    .join(',');

  const parties = raw
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);

  return parties.length > 0 ? parties : undefined;
}

/**
 * Finds (or creates) the local row backing a Clerk account.
 *
 * Existing accounts are matched on email so that users who registered under the
 * old password flow keep their watch history instead of starting over.
 */
async function resolveLocalUser(clerkId: string): Promise<AuthContext | null> {
  const cached = userIdCache.get<AuthContext>(clerkId);
  if (cached) return cached;

  const existing = await User.findOne({ where: { clerkId } });
  if (existing) {
    const context: AuthContext = {
      userId: existing.id,
      clerkId,
      role: existing.role,
    };
    userIdCache.set(clerkId, context);
    return context;
  }

  const clerkUser = await clerkClient.users.getUser(clerkId);
  const email =
    clerkUser.primaryEmailAddress?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress;

  if (!email) return null;

  const normalizedEmail = email.trim().toLowerCase();
  const displayName =
    clerkUser.username ||
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ||
    normalizedEmail.split('@')[0];

  const [user] = await User.findOrCreate({
    where: { email: normalizedEmail },
    defaults: {
      email: normalizedEmail,
      username: displayName,
      clerkId,
      avatarUrl: clerkUser.imageUrl,
      // Clerk has already verified the address before issuing a session.
      isVerified: true,
      role: 'user',
    },
  });

  // Pre-existing row from the password era: adopt it rather than duplicating.
  if (!user.clerkId) {
    user.clerkId = clerkId;
    user.isVerified = true;
    if (clerkUser.imageUrl) user.avatarUrl = clerkUser.imageUrl;
    await user.save();
  }

  const context: AuthContext = {
    userId: user.id,
    clerkId,
    role: user.role,
  };
  userIdCache.set(clerkId, context);
  return context;
}

/**
 * Verifies a Clerk session token and attaches the local user to the request.
 *
 * Replaces the previous hand-rolled JWT middleware: this service no longer
 * issues its own tokens, so signatures are checked against Clerk's JWKS.
 */
export const requireAuth: RequestHandler = async (req, res, next) => {
  const [scheme, token] = req.headers.authorization?.split(' ') ?? [];

  if (scheme !== 'Bearer' || !token) {
    res.status(401).json({ message: 'Access token required' });
    return;
  }

  let clerkId: string;

  try {
    const payload = await verifyToken(token, {
      secretKey,
      authorizedParties: authorizedParties(),
    });
    clerkId = payload.sub;
  } catch {
    res.status(401).json({ message: 'Invalid or expired session' });
    return;
  }

  try {
    const auth = await resolveLocalUser(clerkId);

    if (!auth) {
      res.status(403).json({ message: 'Account has no verified email address' });
      return;
    }

    req.auth = auth;
    next();
  } catch (error) {
    console.error('Could not resolve account for Clerk user:', error);
    res.status(503).json({ message: 'Account lookup temporarily unavailable' });
  }
};

/** Must be mounted after `requireAuth`. Reads the role from the local record. */
export const requireAdmin: RequestHandler = (req, res, next) => {
  const role = req.auth?.role;

  if (role !== 'admin' && role !== 'super_admin') {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }

  next();
};

/** Local user id for the authenticated caller. */
export function getUserId(req: { auth?: AuthContext }): string {
  const userId = req.auth?.userId;
  if (!userId) {
    // Unreachable behind `requireAuth`; throwing beats silently querying `undefined`.
    throw new Error('getUserId called on an unauthenticated request');
  }
  return userId;
}

/** Drops a cached mapping, e.g. after a role change. */
export function invalidateAuthCache(clerkId: string): void {
  userIdCache.del(clerkId);
}
