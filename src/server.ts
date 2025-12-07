import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import sequelize from './config/database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: [
        process.env.CLIENT_URL || 'http://localhost:5173', 
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'https://veloratv-clone.vercel.app',
        'https://strememe.vercel.app',
        'https://streme-me.vercel.app',
        'https://streme-me-git-main-asbin007s-projects.vercel.app'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://www.youtube.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https://image.tmdb.org", "https://img.youtube.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        frameSrc: [
          "'self'",
          "https://www.youtube.com",
          "https://vidsrc.xyz",
          "https://vidsrc.to",
          "https://vidlink.pro",
          "https://superembed.stream",
          "https://vidbinge.com",
          "https://vidsrcme.ru",
          "https://vidsrcme.su",
          "https://vidsrc-me.ru",
          "https://vidsrc-me.su",
          "https://vidsrc-embed.ru",
          "https://vidsrc-embed.su",
          "https://vsrc.su",
          "https://vidfast.pro",
        ],
        connectSrc: ["'self'", "https://api.themoviedb.org"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);
app.use(morgan('dev'));
app.use(cookieParser());

import authRoutes from './routes/authRoutes';
import contentRoutes from './routes/contentRoutes';
import tmdbRoutes from './routes/tmdbRoutes';
import streamRoutes from './routes/stream.route';

app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/tmdb', tmdbRoutes);
app.use('/api/v1/stream', streamRoutes);

app.get('/', (req, res) => {
  res.send('Server is running');
});

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');
    await sequelize.sync({ alter: true }); 
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

startServer();

