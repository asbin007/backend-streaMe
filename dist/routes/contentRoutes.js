"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const contentController_1 = require("../controllers/contentController");
const router = (0, express_1.Router)();
// Movies
router.post('/movies', contentController_1.ContentController.createMovie);
router.get('/movies', contentController_1.ContentController.getAllMovies);
router.get('/movies/:id', contentController_1.ContentController.getMovieById);
router.put('/movies/:id', contentController_1.ContentController.updateMovie);
router.delete('/movies/:id', contentController_1.ContentController.deleteMovie);
// Series
router.post('/series', contentController_1.ContentController.createSeries);
router.get('/series', contentController_1.ContentController.getAllSeries);
router.get('/series/:id', contentController_1.ContentController.getSeriesById);
router.put('/series/:id', contentController_1.ContentController.updateSeries);
router.delete('/series/:id', contentController_1.ContentController.deleteSeries);
// Episodes
router.post('/episodes', contentController_1.ContentController.addEpisode);
router.get('/series/:seriesId/episodes', contentController_1.ContentController.getEpisodesBySeries);
router.put('/episodes/:id', contentController_1.ContentController.updateEpisode);
router.delete('/episodes/:id', contentController_1.ContentController.deleteEpisode);
exports.default = router;
