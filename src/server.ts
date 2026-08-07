import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { validateEnv } from './config/env';
import { createRateLimiter } from './middleware/rateLimiter';
import sequelize from './config/database';

dotenv.config();
validateEnv();

const app = express();
const PORT = process.env.PORT || 5000;

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
app.get('/health', (req, res) => {
  res.json({ ok: true, uptime: process.uptime(), timestamp: new Date().toISOString() });
});

app.use(createRateLimiter());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
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

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled request error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');
    await sequelize.sync({ alter: process.env.NODE_ENV !== 'production' });

    // Start background scheduled tasks
    startCronJobs();

    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

    const shutdown = async (signal: string) => {
      console.log(`${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        await sequelize.close();
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

startServer();
