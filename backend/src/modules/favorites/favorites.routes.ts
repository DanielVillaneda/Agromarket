import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { asyncHandler } from '../../lib/asyncHandler';
import { requireAuth } from '../../middleware/auth';
import { productInclude, serializeProduct } from '../products/product.serializer';

export const favoritesRouter = Router();

favoritesRouter.use(requireAuth);

// GET /api/favorites — equivalente a favoriteProducts.
favoritesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.userId },
      include: { product: { include: productInclude } },
      orderBy: { createdAt: 'desc' },
    });

    res.json(favorites.map((favorite) => serializeProduct(favorite.product)));
  }),
);

// POST /api/favorites/:productId — equivalente a toggleFavorite (lo agrega
// si no estaba, o lo quita si ya estaba, y dice cuál de las dos pasó).
favoritesRouter.post(
  '/:productId',
  asyncHandler(async (req, res) => {
    const productId = Number(req.params.productId);
    const userId = req.userId!;

    const existing = await prisma.favorite.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      res.json({ isFavorite: false });
      return;
    }

    await prisma.favorite.create({ data: { userId, productId } });
    res.json({ isFavorite: true });
  }),
);
