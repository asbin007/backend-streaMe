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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TmdbController = void 0;
const tmdbService_1 = require("../services/tmdbService");
class TmdbController {
    static getTrending(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { mediaType, timeWindow } = req.params;
                const data = yield tmdbService_1.tmdbService.getTrending(mediaType, timeWindow);
                res.status(200).json(data);
            }
            catch (error) {
                res.status(500).json({ message: 'Error fetching trending data', error: error.message });
            }
        });
    }
    static getPopular(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { mediaType } = req.params;
                const data = yield tmdbService_1.tmdbService.getPopular(mediaType);
                res.status(200).json(data);
            }
            catch (error) {
                res.status(500).json({ message: 'Error fetching popular data', error: error.message });
            }
        });
    }
    static getTopRated(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { mediaType } = req.params;
                const data = yield tmdbService_1.tmdbService.getTopRated(mediaType);
                res.status(200).json(data);
            }
            catch (error) {
                res.status(500).json({ message: 'Error fetching top rated data', error: error.message });
            }
        });
    }
    static getDetails(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { mediaType, id } = req.params;
                const data = yield tmdbService_1.tmdbService.getDetails(mediaType, id);
                res.status(200).json(data);
            }
            catch (error) {
                res.status(500).json({ message: 'Error fetching details', error: error.message });
            }
        });
    }
    static getSeasonDetails(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { tvId, seasonNumber } = req.params;
                const data = yield tmdbService_1.tmdbService.getSeasonDetails(tvId, seasonNumber);
                res.status(200).json(data);
            }
            catch (error) {
                res.status(500).json({ message: 'Error fetching season details', error: error.message });
            }
        });
    }
    static searchMulti(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { query, page } = req.query;
                if (!query) {
                    res.status(400).json({ message: 'Query parameter is required' });
                    return;
                }
                const data = yield tmdbService_1.tmdbService.searchMulti(query, page);
                res.status(200).json(data);
            }
            catch (error) {
                res.status(500).json({ message: 'Error searching', error: error.message });
            }
        });
    }
    static getSimilar(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { mediaType, id } = req.params;
                const data = yield tmdbService_1.tmdbService.getSimilar(mediaType, id);
                res.status(200).json(data);
            }
            catch (error) {
                res.status(500).json({ message: 'Error fetching similar content', error: error.message });
            }
        });
    }
    static getVideos(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { mediaType, id } = req.params;
                const data = yield tmdbService_1.tmdbService.getVideos(mediaType, id);
                res.status(200).json(data);
            }
            catch (error) {
                res.status(500).json({ message: 'Error fetching videos', error: error.message });
            }
        });
    }
    static getGenres(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { mediaType } = req.params;
                const data = yield tmdbService_1.tmdbService.getGenres(mediaType);
                res.status(200).json(data);
            }
            catch (error) {
                res.status(500).json({ message: 'Error fetching genres', error: error.message });
            }
        });
    }
    static discover(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { mediaType } = req.params;
                const { page, with_genres } = req.query;
                const data = yield tmdbService_1.tmdbService.discover(mediaType, page, with_genres);
                res.status(200).json(data);
            }
            catch (error) {
                res.status(500).json({ message: 'Error discovering content', error: error.message });
            }
        });
    }
    static getContents(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { mediaType } = req.params;
                const { page, sortBy, genreId } = req.query;
                const filters = {
                    page: page,
                    sortBy: sortBy,
                    genreId: genreId,
                };
                const data = yield tmdbService_1.tmdbService.getContents(mediaType, filters);
                res.status(200).json(data);
            }
            catch (error) {
                res.status(500).json({ message: 'Error fetching contents', error: error.message });
            }
        });
    }
}
exports.TmdbController = TmdbController;
