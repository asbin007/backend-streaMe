import { Request, Response } from 'express';
import { tmdbService } from '../services/tmdbService';

/**
 * Wraps a TMDB passthrough handler.
 *
 * Handlers used to return `error.message` from the upstream failure straight to
 * the client, which exposes internal request detail for no benefit. Now the
 * detail is logged server-side and the client sees a stable message. A failing
 * upstream is reported as 502, not 500, so it is distinguishable in monitoring
 * from a genuine bug in this service.
 */
function handle(
  label: string,
  fn: (req: Request) => Promise<unknown>
): (req: Request, res: Response) => Promise<void> {
  return async (req, res) => {
    try {
      const data = await fn(req);
      res.status(200).json(data);
    } catch (error) {
      console.error(`${label} failed:`, error);
      res.status(502).json({ message: label });
    }
  };
}

export class TmdbController {
  static getTrending = handle('Error fetching trending data', req =>
    tmdbService.getTrending(req.params.mediaType, req.params.timeWindow)
  );

  static getPopular = handle('Error fetching popular data', req =>
    tmdbService.getPopular(req.params.mediaType)
  );

  static getTopRated = handle('Error fetching top rated data', req =>
    tmdbService.getTopRated(req.params.mediaType)
  );

  static getDetails = handle('Error fetching details', req =>
    tmdbService.getDetails(req.params.mediaType, req.params.id)
  );

  static getSeasonDetails = handle('Error fetching season details', req =>
    tmdbService.getSeasonDetails(req.params.tvId, req.params.seasonNumber)
  );

  static getSimilar = handle('Error fetching similar content', req =>
    tmdbService.getSimilar(req.params.mediaType, req.params.id)
  );

  static getVideos = handle('Error fetching videos', req =>
    tmdbService.getVideos(req.params.mediaType, req.params.id)
  );

  static getGenres = handle('Error fetching genres', req =>
    tmdbService.getGenres(req.params.mediaType)
  );

  static getSeasonal = handle('Error fetching seasonal content', req =>
    tmdbService.getSeasonal(req.params.mediaType)
  );

  static discover = handle('Error discovering content', req =>
    tmdbService.discover(
      req.params.mediaType,
      req.query.page as string,
      req.query.with_genres as string
    )
  );

  static getContents = handle('Error fetching contents', req =>
    tmdbService.getContents(req.params.mediaType, {
      page: req.query.page as string,
      sortBy: req.query.sortBy as string,
      genreId: req.query.genreId as string,
    })
  );

  static async searchMulti(req: Request, res: Response): Promise<void> {
    const { query, page } = req.query;

    if (!query || typeof query !== 'string' || !query.trim()) {
      res.status(400).json({ message: 'Query parameter is required' });
      return;
    }

    try {
      const data = await tmdbService.searchMulti(query.trim(), page as string);
      res.status(200).json(data);
    } catch (error) {
      console.error('Error searching:', error);
      res.status(502).json({ message: 'Error searching' });
    }
  }
}
