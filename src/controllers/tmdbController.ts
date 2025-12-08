import { Request, Response } from 'express';
import { tmdbService } from '../services/tmdbService';

export class TmdbController {
  static async getTrending(req: Request, res: Response): Promise<void> {
    try {
      const { mediaType, timeWindow } = req.params;
      const data = await tmdbService.getTrending(mediaType, timeWindow);
      res.status(200).json(data);
    } catch (error: any) {
      res.status(500).json({ message: 'Error fetching trending data', error: error.message });
    }
  }

  static async getPopular(req: Request, res: Response): Promise<void> {
    try {
      const { mediaType } = req.params;
      const data = await tmdbService.getPopular(mediaType);
      res.status(200).json(data);
    } catch (error: any) {
      res.status(500).json({ message: 'Error fetching popular data', error: error.message });
    }
  }

  static async getTopRated(req: Request, res: Response): Promise<void> {
    try {
      const { mediaType } = req.params;
      const data = await tmdbService.getTopRated(mediaType);
      res.status(200).json(data);
    } catch (error: any) {
      res.status(500).json({ message: 'Error fetching top rated data', error: error.message });
    }
  }

  static async getDetails(req: Request, res: Response): Promise<void> {
    try {
      const { mediaType, id } = req.params;
      const data = await tmdbService.getDetails(mediaType, id);
      res.status(200).json(data);
    } catch (error: any) {
      res.status(500).json({ message: 'Error fetching details', error: error.message });
    }
  }

  static async getSeasonDetails(req: Request, res: Response): Promise<void> {
    try {
      const { tvId, seasonNumber } = req.params;
      const data = await tmdbService.getSeasonDetails(tvId, seasonNumber);
      res.status(200).json(data);
    } catch (error: any) {
      res.status(500).json({ message: 'Error fetching season details', error: error.message });
    }
  }

  static async searchMulti(req: Request, res: Response): Promise<void> {
    try {
      const { query, page } = req.query;
      if (!query) {
        res.status(400).json({ message: 'Query parameter is required' });
        return;
      }
      const data = await tmdbService.searchMulti(query as string, page as string);
      res.status(200).json(data);
    } catch (error: any) {
      res.status(500).json({ message: 'Error searching', error: error.message });
    }
  }

  static async getSimilar(req: Request, res: Response): Promise<void> {
    try {
      const { mediaType, id } = req.params;
      const data = await tmdbService.getSimilar(mediaType, id);
      res.status(200).json(data);
    } catch (error: any) {
      res.status(500).json({ message: 'Error fetching similar content', error: error.message });
    }
  }

  static async getVideos(req: Request, res: Response): Promise<void> {
    try {
      const { mediaType, id } = req.params;
      const data = await tmdbService.getVideos(mediaType, id);
      res.status(200).json(data);
    } catch (error: any) {
      res.status(500).json({ message: 'Error fetching videos', error: error.message });
    }
  }

  static async getGenres(req: Request, res: Response): Promise<void> {
    try {
      const { mediaType } = req.params;
      const data = await tmdbService.getGenres(mediaType);
      res.status(200).json(data);
    } catch (error: any) {
      res.status(500).json({ message: 'Error fetching genres', error: error.message });
    }
  }

  static async discover(req: Request, res: Response): Promise<void> {
    try {
      const { mediaType } = req.params;
      const { page, with_genres } = req.query;
      const data = await tmdbService.discover(mediaType, page as string, with_genres as string);
      res.status(200).json(data);
    } catch (error: any) {
      res.status(500).json({ message: 'Error discovering content', error: error.message });
    }
  }

  static async getContents(req: Request, res: Response): Promise<void> {
    try {
      const { mediaType } = req.params;
      const { page, sortBy, genreId } = req.query;
      const filters = {
        page: page as string,
        sortBy: sortBy as string,
        genreId: genreId as string,
      };
      const data = await tmdbService.getContents(mediaType, filters);
      res.status(200).json(data);
    } catch (error: any) {
      res.status(500).json({ message: 'Error fetching contents', error: error.message });
    }
  }

  static async getSeasonal(req: Request, res: Response): Promise<void> {
    try {
      const { mediaType } = req.params;
      const data = await tmdbService.getSeasonal(mediaType);
      res.status(200).json(data);
    } catch (error: any) {
      res.status(500).json({ message: 'Error fetching seasonal content', error: error.message });
    }
  }
}
