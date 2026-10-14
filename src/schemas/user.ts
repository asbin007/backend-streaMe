import { z } from 'zod';

// Shared field vocabulary. Keep tight — anything that lands in the DB passes
// through here, and most of these columns are indexed or user-visible.
const mediaId = z.union([z.string().min(1).max(32), z.number().int().positive()]);
const mediaType = z.enum(['movie', 'tv']);
const title = z.string().trim().min(1).max(500);
const posterPath = z.string().max(500).optional().nullable();

export const historyBodySchema = z.object({
  mediaId,
  mediaType,
  title: title.optional(),
  posterPath,
  // Playback progress and duration are reported from the client in seconds.
  // Cap at ~24h to reject obvious garbage without blocking long-form videos.
  progress: z.number().finite().nonnegative().max(86400).optional(),
  duration: z.number().finite().nonnegative().max(86400).optional(),
  season: z.coerce.number().int().positive().optional().nullable(),
  episode: z.coerce.number().int().positive().optional().nullable(),
});

export const listBodySchema = z.object({
  mediaId,
  mediaType,
  title,
  posterPath,
});

export const pushTokenBodySchema = z.object({
  token: z.string().min(1).max(4096),
  deviceInfo: z.unknown().optional(),
});

export const removePushTokenBodySchema = z.object({
  token: z.string().min(1).max(4096),
});

export type HistoryBody = z.infer<typeof historyBodySchema>;
export type ListBody = z.infer<typeof listBodySchema>;
export type PushTokenBody = z.infer<typeof pushTokenBodySchema>;
