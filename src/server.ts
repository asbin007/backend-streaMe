import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import pino from 'pino';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { validateEnv } from './config/env';
import { createRateLimiter } from './middleware/rateLimiter';
import sequelize from './config/database';
import { initSentry, sentryRequestHandler, sentryErrorHandler } from './config/sentry';

dotenv.config();
validateEnv();
initSentry();

// Structured JSON logs in prod (Render/Fly ingest them for free), pretty
// human-readable in dev. Replaces morgan — same per-request line, with
// req.id, latency, and no string-concat parsing.
export const logger = pino(
  process.env.NODE_ENV === 'production'
    ? { level: process.env.LOG_LEVEL || 'info' }
    : { level: 'debug', transport: { target: 'pino-pretty', options: { colorize: true } } }
);

const app = express();
const PORT = process.env.PORT || 5000;

/** Reported by /health and /ready; set by the background connect routine. */
let dbStatus: 'connecting' | 'connected' | 'unavailable' = 'connecting';

// Render (and every other PaaS) terminates TLS at a proxy. Without this,
// `req.ip` is the proxy's address for every request, which collapses the rate
// limiter into a single shared bucket and breaks `secure` cookie detection.
app.set('trust proxy', 1);
const DEFAULT_CLIENT_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://www.asbin.site',
  'https://veloratv-clone.vercel.app',
  'https://strememe.vercel.app',
  'https://streme-me.vercel.app',
  'https://streme-me-git-main-asbin007s-projects.vercel.app',
  'https://asbin.site',
];
const CLIENT_ORIGINS = [
  process.env.CLIENT_URL,
  ...(process.env.CLIENT_ORIGINS || '').split(','),
  ...DEFAULT_CLIENT_ORIGINS,
]
  .filter((origin): origin is string => Boolean(origin?.trim()))
  .map(origin => origin.trim());

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    return callback(null, CLIENT_ORIGINS.includes(origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://www.youtube.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        imgSrc: ["'self'", 'data:', 'https://image.tmdb.org', 'https://img.youtube.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        frameSrc: [
          "'self'",
          'https://www.youtube.com',
          'https://vidsrc.xyz',
          'https://vidsrc.to',
          'https://vidlink.pro',
          'https://superembed.stream',
          'https://vidbinge.com',
          'https://vidsrcme.ru',
          'https://vidsrcme.su',
          'https://vidsrc-me.ru',
          'https://vidsrc-me.su',
          'https://vidsrc-embed.ru',
          'https://vidsrc-embed.su',
          'https://vsrc.su',
          'https://vidfast.pro',
        ],
        connectSrc: ["'self'", 'https://api.themoviedb.org'],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);
// Health check sits ahead of the limiter so platform uptime probes (which poll
// continuously from a small set of IPs) never consume a client's quota.
/**
 * Liveness. Always 200 while the process is up, so the platform never kills a
 * running server over a database blip. Database state is reported, not fatal.
 */
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    database: dbStatus,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/** Readiness: 503 until the database is actually usable. */
app.get('/ready', (req, res) => {
  const ready = dbStatus === 'connected';
  res.status(ready ? 200 : 503).json({ ready, database: dbStatus });
});

app.use(createRateLimiter());
app.use(sentryRequestHandler());
app.use(pinoHttp({ logger, redact: ['req.headers.authorization', 'req.headers.cookie'] }));
app.use(cookieParser());

import authRoutes from './routes/authRoutes';
import contentRoutes from './routes/contentRoutes';
import tmdbRoutes from './routes/tmdbRoutes';
import streamRoutes from './routes/stream.route';
import reminderRoutes from './routes/reminderRoutes';
import { startCronJobs } from './services/cronJobs';

app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/tmdb', tmdbRoutes);
app.use('/api/v1/stream', streamRoutes);
app.use('/api/reminders', reminderRoutes);

app.get('/', (req, res) => {
  res.send('Server is running');
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use(sentryErrorHandler());
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  (req as Request & { log?: { error: (o: unknown, m?: string) => void } }).log?.error(
    { err: error },
    'Unhandled request error'
  ) ?? logger.error({ err: error }, 'Unhandled request error');
  res.status(500).json({ error: 'Internal server error' });
});

const startServer = async () => {
  try {
    // Bind the port FIRST.
    //
    // This used to await sequelize.authenticate() before listening. When the
    // database was unreachable that call hung rather than rejecting, so the
    // process stayed alive without ever opening a port and Render killed the
    // deploy with "no open ports detected" — a database problem presenting as
    // a deploy failure with nothing useful in the log.
    //
    // Listening first means the platform's port scan and health check always
    // succeed, and database trouble is reported through /health instead.
    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

    const shutdown = async (signal: string) => {
      console.log(`${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        try {
          await sequelize.close();
        } catch {
          // Already down; nothing to release.
        }
        process.exit(0);
      });

      // Do not hang forever if a connection refuses to drain.
      setTimeout(() => process.exit(0), 10_000).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Connect to the database in the background, retrying with backoff.
    void connectDatabase();
  } catch (error) {
    console.error('Failed to start HTTP server:', error);
    process.exit(1);
  }
};

/**
 * Establishes the database connection out of band from HTTP startup, retrying
 * a few times before leaving the server up in a degraded state. Routes that
 * need the database will surface their own errors; /health reports the status.
 */
const connectDatabase = async (): Promise<void> => {
  const MAX_ATTEMPTS = 5;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await sequelize.authenticate();
      console.log('Database connected successfully.');

      // `alter` inspects and rewrites live tables, which is slow and can lock
      // them. Never in production — schema changes go through migrations.
      if (process.env.NODE_ENV !== 'production') {
        await sequelize.sync({ alter: true });
      }

      dbStatus = 'connected';
      startCronJobs();
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Database connection attempt ${attempt}/${MAX_ATTEMPTS} failed: ${message}`);

      if (attempt === MAX_ATTEMPTS) {
        dbStatus = 'unavailable';
        console.error(
          'Giving up on the database. The server stays up so health checks pass, ' +
            'but any route that reads or writes data will fail until this is resolved.'
        );
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 2 ** attempt * 1000));
    }
  }
};

startServer();
