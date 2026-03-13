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
        const zodError = error as z.ZodError;
        const message = zodError.errors
          .map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`)
          .join(', ');
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
        storeId: z.number().int().positive().optional(),
        items: z.array(z.object({
          productId: z.number().int().positive(),
          quantity: z.number().int().min(1).max(100),
        })).min(1),
        deliveryAddress: z.object({
          label: z.string().min(1),
          address_line: z.string().min(1),
          city: z.string().min(1).optional(),
          pincode: z.string().min(4).max(10).optional(),
          lat: z.number().optional(),
          lng: z.number().optional(),
        }),
        paymentMethod: z.enum(['cod', 'online', 'wallet']).optional(),
        couponCode: z.string().min(3).max(50).optional(),
        instructions: z.string().max(500).optional(),
      }),
    }),
    statusUpdate: z.object({
      params: z.object({
        id: z.string(),
      }),
      body: z.object({
        status: z.enum(['placed', 'confirmed', 'preparing', 'ready', 'assigned', 'pickup', 'out_for_delivery', 'delivered', 'cancelled', 'refunded']),
      }),
    }),
  },
  payments: {
    createOrder: z.object({
      body: z.object({
        orderId: z.number().int().positive(),
      }),
    }),
    verify: z.object({
      body: z.object({
        orderId: z.number().int().positive(),
        razorpay_order_id: z.string().min(5),
        razorpay_payment_id: z.string().min(5),
        razorpay_signature: z.string().min(5),
      }),
    }),
    refund: z.object({
      body: z.object({
        orderId: z.number().int().positive(),
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
