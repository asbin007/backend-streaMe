import axios from 'axios';
import dotenv from 'dotenv';
import { cacheService } from './cacheService';

dotenv.config();

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const ACCESS_TOKEN = process.env.API_ACCESS_TOKEN;

const tmdbApi = axios.create({
  baseURL: TMDB_BASE_URL,
  headers: {
    Authorization: `Bearer ${ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

export const tmdbService = {
  // ... (existing methods)

  getContents: async (mediaType: string, filters: any = {}) => {
    const cacheKey = `contents_${mediaType}_${JSON.stringify(filters)}`;
    const cachedData = cacheService.get(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    try {
      const params: any = {
        page: filters.page || 1,
        sort_by: filters.sortBy || 'popularity.desc',
      };

      if (filters.genreId) {
        params.with_genres = filters.genreId;
      }

      // Use discover endpoint for everything as it's the most flexible
      const response = await tmdbApi.get(`/discover/${mediaType}`, { params });
      
      cacheService.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ... (keep other methods for backward compatibility or specific needs)
  getTrending: async (mediaType: string, timeWindow: string) => {
    try {
      const response = await tmdbApi.get(`/trending/${mediaType}/${timeWindow}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getPopular: async (mediaType: string) => {
    try {
      const response = await tmdbApi.get(`/${mediaType}/popular`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getTopRated: async (mediaType: string) => {
    try {
      const response = await tmdbApi.get(`/${mediaType}/top_rated`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getDetails: async (mediaType: string, id: string) => {
    try {
      const response = await tmdbApi.get(`/${mediaType}/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getSeasonDetails: async (tvId: string, seasonNumber: string) => {
    try {
      const response = await tmdbApi.get(`/tv/${tvId}/season/${seasonNumber}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  searchMulti: async (query: string, page: string = '1') => {
    try {
      const response = await tmdbApi.get(`/search/multi`, {
        params: { query, page },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getSimilar: async (mediaType: string, id: string) => {
    try {
      const response = await tmdbApi.get(`/${mediaType}/${id}/similar`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getVideos: async (mediaType: string, id: string) => {
    try {
      const response = await tmdbApi.get(`/${mediaType}/${id}/videos`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getGenres: async (mediaType: string) => {
    try {
      const response = await tmdbApi.get(`/genre/${mediaType}/list`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  discover: async (mediaType: string, page: string = '1', genreId?: string) => {
    try {
      const params: any = { page };
      if (genreId) {
        params.with_genres = genreId;
      }
      const response = await tmdbApi.get(`/discover/${mediaType}`, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};
