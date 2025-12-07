import { Router } from 'express';
import { ContentController } from '../controllers/contentController';

const router = Router();

// Movies
router.post('/movies', ContentController.createMovie);
router.get('/movies', ContentController.getAllMovies);
router.get('/movies/:id', ContentController.getMovieById);
router.put('/movies/:id', ContentController.updateMovie);
router.delete('/movies/:id', ContentController.deleteMovie);

// Series
router.post('/series', ContentController.createSeries);
router.get('/series', ContentController.getAllSeries);
router.get('/series/:id', ContentController.getSeriesById);
router.put('/series/:id', ContentController.updateSeries);
router.delete('/series/:id', ContentController.deleteSeries);

// Episodes
router.post('/episodes', ContentController.addEpisode);
router.get('/series/:seriesId/episodes', ContentController.getEpisodesBySeries);
router.put('/episodes/:id', ContentController.updateEpisode);
router.delete('/episodes/:id', ContentController.deleteEpisode);

export default router;
