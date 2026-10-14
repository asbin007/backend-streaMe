import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { validateBody } from '../src/middleware/validate';
import {
  historyBodySchema,
  listBodySchema,
  pushTokenBodySchema,
} from '../src/schemas/user';

// Minimal express app that applies validateBody and echoes the parsed body.
// Testing the middleware against a real express pipeline catches the kind of
// bugs a direct unit test would miss (next() ordering, header shape, JSON
// body-parser edge cases).
function appWith<T>(schema: Parameters<typeof validateBody<T>>[0]) {
  const app = express();
  app.use(express.json());
  app.post('/', validateBody(schema), (req, res) => {
    res.json({ ok: true, body: req.body });
  });
  return app;
}

describe('validateBody', () => {
  describe('historyBodySchema', () => {
    const app = appWith(historyBodySchema);

    it('accepts a well-formed body', async () => {
      const res = await request(app).post('/').send({
        mediaId: 42,
        mediaType: 'movie',
        progress: 120,
        duration: 7200,
      });
      expect(res.status).toBe(200);
      expect(res.body.body.mediaId).toBe(42);
    });

    it('rejects an unknown mediaType', async () => {
      const res = await request(app).post('/').send({ mediaId: 1, mediaType: 'podcast' });
      expect(res.status).toBe(400);
      expect(res.body.field).toBe('mediaType');
    });

    it('rejects a negative progress', async () => {
      const res = await request(app)
        .post('/')
        .send({ mediaId: 1, mediaType: 'movie', progress: -1 });
      expect(res.status).toBe(400);
      expect(res.body.field).toBe('progress');
    });

    it('rejects progress beyond the 24h cap', async () => {
      const res = await request(app)
        .post('/')
        .send({ mediaId: 1, mediaType: 'movie', progress: 1_000_000 });
      expect(res.status).toBe(400);
    });
  });

  describe('listBodySchema', () => {
    const app = appWith(listBodySchema);

    it('requires a title', async () => {
      const res = await request(app).post('/').send({ mediaId: 1, mediaType: 'movie' });
      expect(res.status).toBe(400);
      expect(res.body.field).toBe('title');
    });

    it('trims title whitespace', async () => {
      const res = await request(app)
        .post('/')
        .send({ mediaId: 1, mediaType: 'tv', title: '  Breaking Bad  ' });
      expect(res.status).toBe(200);
      expect(res.body.body.title).toBe('Breaking Bad');
    });
  });

  describe('pushTokenBodySchema', () => {
    const app = appWith(pushTokenBodySchema);

    it('rejects an empty token', async () => {
      const res = await request(app).post('/').send({ token: '' });
      expect(res.status).toBe(400);
    });

    it('rejects a token longer than 4096 chars', async () => {
      const res = await request(app).post('/').send({ token: 'x'.repeat(4097) });
      expect(res.status).toBe(400);
    });
  });
});
