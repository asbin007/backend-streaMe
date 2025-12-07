"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tmdbService = void 0;
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
const cacheService_1 = require("./cacheService");
dotenv_1.default.config();
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const ACCESS_TOKEN = process.env.API_ACCESS_TOKEN;
const tmdbApi = axios_1.default.create({
    baseURL: TMDB_BASE_URL,
    headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
    },
});
exports.tmdbService = {
    // ... (existing methods)
    getContents: (mediaType_1, ...args_1) => __awaiter(void 0, [mediaType_1, ...args_1], void 0, function* (mediaType, filters = {}) {
        const cacheKey = `contents_${mediaType}_${JSON.stringify(filters)}`;
        const cachedData = cacheService_1.cacheService.get(cacheKey);
        if (cachedData) {
            return cachedData;
        }
        try {
            const params = {
                page: filters.page || 1,
                sort_by: filters.sortBy || 'popularity.desc',
            };
            if (filters.genreId) {
                params.with_genres = filters.genreId;
            }
            // Use discover endpoint for everything as it's the most flexible
            const response = yield tmdbApi.get(`/discover/${mediaType}`, { params });
            cacheService_1.cacheService.set(cacheKey, response.data);
            return response.data;
        }
        catch (error) {
            throw error;
        }
    }),
    // ... (keep other methods for backward compatibility or specific needs)
    getTrending: (mediaType, timeWindow) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const response = yield tmdbApi.get(`/trending/${mediaType}/${timeWindow}`);
            return response.data;
        }
        catch (error) {
            throw error;
        }
    }),
    getPopular: (mediaType) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const response = yield tmdbApi.get(`/${mediaType}/popular`);
            return response.data;
        }
        catch (error) {
            throw error;
        }
    }),
    getTopRated: (mediaType) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const response = yield tmdbApi.get(`/${mediaType}/top_rated`);
            return response.data;
        }
        catch (error) {
            throw error;
        }
    }),
    getDetails: (mediaType, id) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const response = yield tmdbApi.get(`/${mediaType}/${id}`);
            return response.data;
        }
        catch (error) {
            throw error;
        }
    }),
    getSeasonDetails: (tvId, seasonNumber) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const response = yield tmdbApi.get(`/tv/${tvId}/season/${seasonNumber}`);
            return response.data;
        }
        catch (error) {
            throw error;
        }
    }),
    searchMulti: (query_1, ...args_1) => __awaiter(void 0, [query_1, ...args_1], void 0, function* (query, page = '1') {
        try {
            const response = yield tmdbApi.get(`/search/multi`, {
                params: { query, page },
            });
            return response.data;
        }
        catch (error) {
            throw error;
        }
    }),
    getSimilar: (mediaType, id) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const response = yield tmdbApi.get(`/${mediaType}/${id}/similar`);
            return response.data;
        }
        catch (error) {
            throw error;
        }
    }),
    getVideos: (mediaType, id) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const response = yield tmdbApi.get(`/${mediaType}/${id}/videos`);
            return response.data;
        }
        catch (error) {
            throw error;
        }
    }),
    getGenres: (mediaType) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const response = yield tmdbApi.get(`/genre/${mediaType}/list`);
            return response.data;
        }
        catch (error) {
            throw error;
        }
    }),
    discover: (mediaType_1, ...args_1) => __awaiter(void 0, [mediaType_1, ...args_1], void 0, function* (mediaType, page = '1', genreId) {
        try {
            const params = { page };
            if (genreId) {
                params.with_genres = genreId;
            }
            const response = yield tmdbApi.get(`/discover/${mediaType}`, { params });
            return response.data;
        }
        catch (error) {
            throw error;
        }
    })
};
