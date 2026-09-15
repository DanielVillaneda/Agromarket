import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { asyncHandler } from '../../lib/asyncHandler';
import { requireAuth } from '../../middleware/auth';
import { productInclude, serializeProduct } from '../products/product.serializer';

export const recentlyViewedRouter = Router();

// GET /api/recently-viewed — equivalente a recentlyViewedProducts (los
// últimos 6 productos vistos). markViewed() ya no hace falta como acción
// aparte: GET /api/products/:id registra la visita automáticamente.
recentlyViewedRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const viewed = await prisma.recentlyViewed.findMany({
      where: { userId: req.userId },
      include: { product: { include: productInclude } },
      orderBy: { viewedAt: 'desc' },
      take: 6,
    });

    res.json(viewed.map((entry) => serializeProduct(entry.product)));
  }),
);
