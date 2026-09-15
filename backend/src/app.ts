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

export function createApp(): Express {
  const app = express();

  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json());

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
