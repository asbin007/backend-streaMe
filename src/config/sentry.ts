import type { ErrorRequestHandler, RequestHandler } from 'express';

// Opt-in Sentry wiring. Load the SDK lazily so a backend without SENTRY_DSN
// has no Sentry code paths at all — not even an idle init call. When the env
// var is set, Sentry's own Express handlers wrap request + error middleware
// positions in server.ts. When unset, the middlewares here are no-ops so the
// chain still compiles.
//
// Keeping Sentry optional matters because the Render free tier does not need
// an extra outbound HTTP call per request from a project that has not yet
// signed up.

const DSN = process.env.SENTRY_DSN;

type SentryModule = typeof import('@sentry/node');
let Sentry: SentryModule | null = null;

export function initSentry(): void {
  if (!DSN) return;
  try {
    Sentry = require('@sentry/node') as SentryModule;
    Sentry.init({
      dsn: DSN,
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.05'),
      environment: process.env.NODE_ENV || 'development',
      release: process.env.RENDER_GIT_COMMIT || process.env.GIT_SHA,
    });
  } catch (err) {
    console.warn('[sentry] init failed, continuing without:', (err as Error).message);
  }
}

export function sentryRequestHandler(): RequestHandler {
  if (!Sentry) return (_req, _res, next) => next();
  return Sentry.Handlers.requestHandler();
}

export function sentryErrorHandler(): ErrorRequestHandler {
  if (!Sentry) return (_err, _req, _res, next) => next(_err);
  return Sentry.Handlers.errorHandler();
}
