import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';

export const validate = (schema: z.AnyZodObject) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const message = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ');
        return next(new AppError(`Validation failed: ${message}`, 400));
      }
      return next(error);
    }
  };
};

// Common Schemas
export const schemas = {
  auth: {
    login: z.object({
      body: z.object({
        email: z.string().email(),
        password: z.string().min(8),
      }),
    }),
    register: z.object({
      body: z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().min(2),
        phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone format'),
      }),
    }),
  },
  orders: {
    create: z.object({
      body: z.object({
        store_id: z.string().uuid(),
        items: z.array(z.object({
          product_id: z.string().uuid(),
          quantity: z.number().int().positive(),
        })).min(1),
        address_id: z.string().uuid(),
        payment_method: z.enum(['COD', 'CARD', 'WALLET']),
      }),
    }),
    statusUpdate: z.object({
      params: z.object({
        id: z.string().uuid(),
      }),
      body: z.object({
        status: z.enum(['ACCEPTED', 'PREPARING', 'READY', 'PICKED_UP', 'DELIVERED', 'CANCELLED']),
      }),
    }),
  },
  search: {
    query: z.object({
      query: z.object({
        q: z.string().min(1),
        lat: z.string().optional(),
        lng: z.string().optional(),
      }),
    }),
  },
  merchants: {
    updateProfile: z.object({
      body: z.object({
        name: z.string().min(2).optional(),
        address: z.string().optional(),
        phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
      }),
    }),
  },
  drivers: {
    updateLocation: z.object({
      body: z.object({
        lat: z.number(),
        lng: z.number(),
      }),
    }),
  },
};
