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
exports.ContentController = void 0;
const Movie_1 = require("../models/Movie");
const Series_1 = require("../models/Series");
const Episode_1 = require("../models/Episode");
class ContentController {
    // --- Movies ---
    static createMovie(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const movie = yield Movie_1.Movie.create(req.body);
                res.status(201).json(movie);
            }
            catch (error) {
                res.status(500).json({ message: 'Error creating movie', error });
            }
        });
    }
    static getAllMovies(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const movies = yield Movie_1.Movie.findAll();
                res.status(200).json(movies);
            }
            catch (error) {
                res.status(500).json({ message: 'Error fetching movies', error });
            }
        });
    }
    static getMovieById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const movie = yield Movie_1.Movie.findByPk(req.params.id);
                if (!movie) {
                    res.status(404).json({ message: 'Movie not found' });
                    return;
                }
                res.status(200).json(movie);
            }
            catch (error) {
                res.status(500).json({ message: 'Error fetching movie', error });
            }
        });
    }
    static updateMovie(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const [updated] = yield Movie_1.Movie.update(req.body, {
                    where: { id: req.params.id },
                });
                if (updated) {
                    const updatedMovie = yield Movie_1.Movie.findByPk(req.params.id);
                    res.status(200).json(updatedMovie);
                }
                else {
                    res.status(404).json({ message: 'Movie not found' });
                }
            }
            catch (error) {
                res.status(500).json({ message: 'Error updating movie', error });
            }
        });
    }
    static deleteMovie(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const deleted = yield Movie_1.Movie.destroy({
                    where: { id: req.params.id },
                });
                if (deleted) {
                    res.status(204).send();
                }
                else {
                    res.status(404).json({ message: 'Movie not found' });
                }
            }
            catch (error) {
                res.status(500).json({ message: 'Error deleting movie', error });
            }
        });
    }
    // --- Series ---
    static createSeries(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const series = yield Series_1.Series.create(req.body);
                res.status(201).json(series);
            }
            catch (error) {
                res.status(500).json({ message: 'Error creating series', error });
            }
        });
    }
    static getAllSeries(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const series = yield Series_1.Series.findAll({ include: [Episode_1.Episode] });
                res.status(200).json(series);
            }
            catch (error) {
                res.status(500).json({ message: 'Error fetching series', error });
            }
        });
    }
    static getSeriesById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const series = yield Series_1.Series.findByPk(req.params.id, { include: [Episode_1.Episode] });
                if (!series) {
                    res.status(404).json({ message: 'Series not found' });
                    return;
                }
                res.status(200).json(series);
            }
            catch (error) {
                res.status(500).json({ message: 'Error fetching series', error });
            }
        });
    }
    static updateSeries(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const [updated] = yield Series_1.Series.update(req.body, {
                    where: { id: req.params.id },
                });
                if (updated) {
                    const updatedSeries = yield Series_1.Series.findByPk(req.params.id);
                    res.status(200).json(updatedSeries);
                }
                else {
                    res.status(404).json({ message: 'Series not found' });
                }
            }
            catch (error) {
                res.status(500).json({ message: 'Error updating series', error });
            }
        });
    }
    static deleteSeries(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const deleted = yield Series_1.Series.destroy({
                    where: { id: req.params.id },
                });
                if (deleted) {
                    res.status(204).send();
                }
                else {
                    res.status(404).json({ message: 'Series not found' });
                }
            }
            catch (error) {
                res.status(500).json({ message: 'Error deleting series', error });
            }
        });
    }
    // --- Episodes ---
    static addEpisode(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const episode = yield Episode_1.Episode.create(req.body);
                res.status(201).json(episode);
            }
            catch (error) {
                res.status(500).json({ message: 'Error adding episode', error });
            }
        });
    }
    static getEpisodesBySeries(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const episodes = yield Episode_1.Episode.findAll({
                    where: { seriesId: req.params.seriesId },
                    order: [['seasonNumber', 'ASC'], ['episodeNumber', 'ASC']],
                });
                res.status(200).json(episodes);
            }
            catch (error) {
                res.status(500).json({ message: 'Error fetching episodes', error });
            }
        });
    }
    static updateEpisode(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const [updated] = yield Episode_1.Episode.update(req.body, {
                    where: { id: req.params.id },
                });
                if (updated) {
                    const updatedEpisode = yield Episode_1.Episode.findByPk(req.params.id);
                    res.status(200).json(updatedEpisode);
                }
                else {
                    res.status(404).json({ message: 'Episode not found' });
                }
            }
            catch (error) {
                res.status(500).json({ message: 'Error updating episode', error });
            }
        });
    }
    static deleteEpisode(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const deleted = yield Episode_1.Episode.destroy({
                    where: { id: req.params.id },
                });
                if (deleted) {
                    res.status(204).send();
                }
                else {
                    res.status(404).json({ message: 'Episode not found' });
                }
            }
            catch (error) {
                res.status(500).json({ message: 'Error deleting episode', error });
            }
        });
    }
}
exports.ContentController = ContentController;
