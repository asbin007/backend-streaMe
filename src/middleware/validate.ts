import type { Request, Response, NextFunction } from 'express';
import { ZodError, type ZodSchema } from 'zod';

// Validates `req.body` against a Zod schema. On success, replaces the body
// with the parsed value so controllers get strongly-typed, coerced input.
// On failure, returns a flat 400 with the first issue path and message.
export const validateBody =
  <T>(schema: ZodSchema<T>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const issue = err.issues[0];
        res.status(400).json({
          message: 'Invalid request body',
          field: issue?.path.join('.') || null,
          error: issue?.message || 'Validation failed',
        });
        return;
      }
      next(err);
    }
  };
