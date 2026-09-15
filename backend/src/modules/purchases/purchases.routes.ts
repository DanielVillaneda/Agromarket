import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { asyncHandler } from '../../lib/asyncHandler';
import { badRequest } from '../../lib/httpError';
import { requireAuth } from '../../middleware/auth';
import { productInclude, serializeProduct } from '../products/product.serializer';

export const purchasesRouter = Router();

purchasesRouter.use(requireAuth);

// GET /api/purchases — equivalente a purchasedProducts (historial de
// compras, más reciente primero).
purchasesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const purchases = await prisma.purchase.findMany({
      where: { userId: req.userId },
      include: { product: { include: productInclude } },
      orderBy: { purchasedAt: 'desc' },
    });

    res.json(
      purchases.map((purchase) => ({
        id: purchase.id,
        quantity: purchase.quantity,
        unitPrice: purchase.unitPrice,
        purchasedAt: purchase.purchasedAt,
        product: serializeProduct(purchase.product),
      })),
    );
  }),
);

// POST /api/checkout — equivalente a checkout() en carritocompras.page.ts:
// convierte todo el carrito actual en compras (guardando el precio de ese
// momento) y lo vacía. Usa una transacción para que no quede el carrito a
// medio vaciar si algo falla a mitad de camino.
purchasesRouter.post(
  '/checkout',
  asyncHandler(async (req, res) => {
    const userId = req.userId!;

    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
    });

    if (cartItems.length === 0) {
      throw badRequest('Tu carrito está vacío.');
    }

    const purchases = await prisma.$transaction(async (tx) => {
      const created = await Promise.all(
        cartItems.map((item) =>
          tx.purchase.create({
            data: {
              userId,
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.product.price,
            },
          }),
        ),
      );

      await tx.cartItem.deleteMany({ where: { userId } });

      return created;
    });

    res.status(201).json({ purchasedCount: purchases.length });
  }),
);
