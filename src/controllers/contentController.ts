import { Request, Response } from 'express';
import { Movie } from '../models/Movie';
import { Series } from '../models/Series';
import { Episode } from '../models/Episode';

export class ContentController {
  // --- Movies ---
  static async createMovie(req: Request, res: Response): Promise<void> {
    try {
      const movie = await Movie.create(req.body);
      res.status(201).json(movie);
    } catch (error) {
      res.status(500).json({ message: 'Error creating movie', error });
    }
  }

  static async getAllMovies(req: Request, res: Response): Promise<void> {
    try {
      const movies = await Movie.findAll();
      res.status(200).json(movies);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching movies', error });
    }
  }

  static async getMovieById(req: Request, res: Response): Promise<void> {
    try {
      const movie = await Movie.findByPk(req.params.id);
      if (!movie) {
        res.status(404).json({ message: 'Movie not found' });
        return;
      }
      res.status(200).json(movie);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching movie', error });
    }
  }

  static async updateMovie(req: Request, res: Response): Promise<void> {
    try {
      const [updated] = await Movie.update(req.body, {
        where: { id: req.params.id },
      });
      if (updated) {
        const updatedMovie = await Movie.findByPk(req.params.id);
        res.status(200).json(updatedMovie);
      } else {
        res.status(404).json({ message: 'Movie not found' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error updating movie', error });
    }
  }

  static async deleteMovie(req: Request, res: Response): Promise<void> {
    try {
      const deleted = await Movie.destroy({
        where: { id: req.params.id },
      });
      if (deleted) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: 'Movie not found' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error deleting movie', error });
    }
  }

  // --- Series ---
  static async createSeries(req: Request, res: Response): Promise<void> {
    try {
      const series = await Series.create(req.body);
      res.status(201).json(series);
    } catch (error) {
      res.status(500).json({ message: 'Error creating series', error });
    }
  }

  static async getAllSeries(req: Request, res: Response): Promise<void> {
    try {
      const series = await Series.findAll({ include: [Episode] });
      res.status(200).json(series);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching series', error });
    }
  }

  static async getSeriesById(req: Request, res: Response): Promise<void> {
    try {
      const series = await Series.findByPk(req.params.id, { include: [Episode] });
      if (!series) {
        res.status(404).json({ message: 'Series not found' });
        return;
      }
      res.status(200).json(series);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching series', error });
    }
  }

  static async updateSeries(req: Request, res: Response): Promise<void> {
    try {
      const [updated] = await Series.update(req.body, {
        where: { id: req.params.id },
      });
      if (updated) {
        const updatedSeries = await Series.findByPk(req.params.id);
        res.status(200).json(updatedSeries);
      } else {
        res.status(404).json({ message: 'Series not found' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error updating series', error });
    }
  }

  static async deleteSeries(req: Request, res: Response): Promise<void> {
    try {
      const deleted = await Series.destroy({
        where: { id: req.params.id },
      });
      if (deleted) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: 'Series not found' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error deleting series', error });
    }
  }

  // --- Episodes ---
  static async addEpisode(req: Request, res: Response): Promise<void> {
    try {
      const episode = await Episode.create(req.body);
      res.status(201).json(episode);
    } catch (error) {
      res.status(500).json({ message: 'Error adding episode', error });
    }
  }

  static async getEpisodesBySeries(req: Request, res: Response): Promise<void> {
    try {
      const episodes = await Episode.findAll({
        where: { seriesId: req.params.seriesId },
        order: [['seasonNumber', 'ASC'], ['episodeNumber', 'ASC']],
      });
      res.status(200).json(episodes);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching episodes', error });
    }
  }

  static async updateEpisode(req: Request, res: Response): Promise<void> {
    try {
      const [updated] = await Episode.update(req.body, {
        where: { id: req.params.id },
      });
      if (updated) {
        const updatedEpisode = await Episode.findByPk(req.params.id);
        res.status(200).json(updatedEpisode);
      } else {
        res.status(404).json({ message: 'Episode not found' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error updating episode', error });
    }
  }

  static async deleteEpisode(req: Request, res: Response): Promise<void> {
    try {
      const deleted = await Episode.destroy({
        where: { id: req.params.id },
      });
      if (deleted) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: 'Episode not found' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error deleting episode', error });
    }
  }
}
