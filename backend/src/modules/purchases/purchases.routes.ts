import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { asyncHandler } from '../../lib/asyncHandler';
import { badRequest } from '../../lib/httpError';
import { requireAuth } from '../../middleware/auth';
import { productInclude, serializeProduct } from '../products/product.serializer';
import { productUnitLabels, ProductUnit } from '../products/product.schemas';
import { canConvert, convertPrice, convertWeight, formatAmount } from '../../lib/units';

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
        unit: purchase.unit,
        unitPrice: purchase.unitPrice,
        purchasedAt: purchase.purchasedAt,
        product: serializeProduct(purchase.product),
      })),
    );
  }),
);

// POST /api/checkout — equivalente a checkout() en carritocompras.page.ts:
// convierte todo el carrito actual en compras (guardando el precio de ese
// momento, ya en la unidad que eligió el comprador) y lo vacía. Usa una
// transacción para que no quede el carrito a medio vaciar si algo falla a
// mitad de camino.
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

    // Revalida el stock justo antes de comprar: pudo bajar (por otra
    // compra, o porque el vendedor lo editó) desde que se agregó al
    // carrito. La cantidad del carrito está en la unidad que eligió el
    // comprador, así que se convierte a la unidad del producto para
    // compararla contra el stock real.
    for (const item of cartItems) {
      if (!canConvert(item.unit, item.product.unit)) {
        throw badRequest(`"${item.product.title}" ya no está disponible en esa unidad.`);
      }

      const quantityInProductUnit = convertWeight(item.quantity, item.unit, item.product.unit);
      if (quantityInProductUnit > item.product.quantity + 1e-9) {
        const unitLabel = productUnitLabels[item.unit as ProductUnit] ?? item.unit;
        const maxInItemUnit = convertWeight(item.product.quantity, item.product.unit, item.unit);
        throw badRequest(
          `Ya no hay suficiente stock de "${item.product.title}". Quedan ${formatAmount(maxInItemUnit)} ${unitLabel} disponibles.`,
        );
      }
    }

    const purchases = await prisma.$transaction(async (tx) => {
      const created = await Promise.all(
        cartItems.map((item) => {
          const pricePerItemUnit = Math.round(convertPrice(item.product.price, item.product.unit, item.unit));
          return tx.purchase.create({
            data: {
              userId,
              productId: item.productId,
              quantity: item.quantity,
              unit: item.unit,
              unitPrice: pricePerItemUnit,
            },
          });
        }),
      );

      // Descuenta del stock del producto lo que se acaba de vender,
      // convirtiendo la cantidad comprada a la unidad nativa del producto.
      await Promise.all(
        cartItems.map((item) => {
          const decrementInProductUnit = Math.round(convertWeight(item.quantity, item.unit, item.product.unit));
          return tx.product.update({
            where: { id: item.productId },
            data: { quantity: { decrement: decrementInProductUnit } },
          });
        }),
      );

      await tx.cartItem.deleteMany({ where: { userId } });

      return created;
    });

    res.status(201).json({ purchasedCount: purchases.length });
  }),
);
