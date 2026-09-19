import cors from 'cors';
import express, { Express } from 'express';
import { env } from './lib/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { authRouter } from './modules/auth/auth.routes';
import { productsRouter } from './modules/products/products.routes';
import { favoritesRouter } from './modules/favorites/favorites.routes';
import { cartRouter } from './modules/cart/cart.routes';
import { purchasesRouter } from './modules/purchases/purchases.routes';
import { recentlyViewedRouter } from './modules/recently-viewed/recently-viewed.routes';

const allowedOrigins = env.corsOrigin
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const isLocalOrigin = (origin: string) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

export function createApp(): Express {
  const app = express();

  app.use(
    cors({
      origin(origin, callback) {
        // Sin header Origin (curl, apps nativas) o coincide con la lista/localhost: se permite.
        if (!origin || allowedOrigins.includes(origin) || isLocalOrigin(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error('Origen no permitido por CORS.'));
      },
    }),
  );
  // Límite alto porque las fotos de producto viajan como data URLs base64
  // en el body (no hay almacenamiento de archivos configurado todavía).
  app.use(express.json({ limit: '15mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/products', productsRouter);
  app.use('/api/favorites', favoritesRouter);
  app.use('/api/cart', cartRouter);
  app.use('/api/purchases', purchasesRouter);
  app.use('/api/recently-viewed', recentlyViewedRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
