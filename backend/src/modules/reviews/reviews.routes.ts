import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { asyncHandler } from '../../lib/asyncHandler';
import { parseId } from '../../lib/params';
import { forbidden, notFound } from '../../lib/httpError';
import { attachUserIfPresent, requireAuth } from '../../middleware/auth';
import { rateProductSchema } from './reviews.schemas';
import { roundRatingAverage } from './reviews.summary';

export const reviewsRouter = Router();

// Resumen de calificaciones de un producto + la calificación del usuario (si la hay).
async function getSummary(productId: number, userId?: number) {
  const [aggregate, mine] = await Promise.all([
    prisma.review.aggregate({ where: { productId }, _avg: { rating: true }, _count: true }),
    userId
      ? prisma.review.findUnique({ where: { productId_userId: { productId, userId } }, select: { rating: true } })
      : Promise.resolve(null),
  ]);

  return {
    ratingAverage: roundRatingAverage(aggregate._avg.rating, aggregate._count),
    ratingCount: aggregate._count,
    myRating: mine?.rating ?? null,
  };
}

// POST /api/reviews/:productId — crea o actualiza la calificación del usuario.
reviewsRouter.post(
  '/:productId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const productId = parseId(req.params.productId);
    const userId = req.userId!;
    const { rating } = rateProductSchema.parse(req.body);

    const product = await prisma.product.findUnique({ where: { id: productId }, select: { sellerId: true } });
    if (!product) {
      throw notFound('No encontramos este producto.');
    }
    if (product.sellerId === userId) {
      throw forbidden('No puedes calificar tu propio producto.');
    }

    const key = { productId_userId: { productId, userId } };
    const existing = await prisma.review.findUnique({ where: key, select: { id: true } });

    // upsert evita un 500 si dos peticiones concurrentes chocan con el índice único.
    await prisma.review.upsert({
      where: key,
      create: { productId, userId, rating },
      update: { rating },
    });

    res.status(existing ? 200 : 201).json(await getSummary(productId, userId));
  }),
);

// GET /api/reviews/:productId — resumen público; myRating solo con sesión.
reviewsRouter.get(
  '/:productId',
  attachUserIfPresent,
  asyncHandler(async (req, res) => {
    const productId = parseId(req.params.productId);

    const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!product) {
      throw notFound('No encontramos este producto.');
    }

    res.json(await getSummary(productId, req.userId));
  }),
);
