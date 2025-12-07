import { Router } from 'express';
import { TmdbController } from '../controllers/tmdbController';

const router = Router();

router.get('/trending/:mediaType/:timeWindow', TmdbController.getTrending);
router.get('/:mediaType/popular', TmdbController.getPopular);
router.get('/:mediaType/top_rated', TmdbController.getTopRated);
router.get('/search/multi', TmdbController.searchMulti);
router.get('/:mediaType/:id', TmdbController.getDetails);
router.get('/:mediaType/:id/similar', TmdbController.getSimilar);
router.get('/:mediaType/:id/videos', TmdbController.getVideos);
router.get('/genre/:mediaType/list', TmdbController.getGenres);
router.get('/contents/:mediaType', TmdbController.getContents);
router.get('/discover/:mediaType', TmdbController.discover);
router.get('/tv/:tvId/season/:seasonNumber', TmdbController.getSeasonDetails);

export default router;
