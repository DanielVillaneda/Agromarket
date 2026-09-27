import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { asyncHandler } from '../../lib/asyncHandler';
import { badRequest, conflict } from '../../lib/httpError';
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
      // Vacía primero el carrito leído: si otro checkout del mismo usuario
      // corre en paralelo, este delete espera al otro y encuentra menos
      // filas, así que la compra no se registra dos veces.
      const deleted = await tx.cartItem.deleteMany({
        where: { id: { in: cartItems.map((item) => item.id) } },
      });
      if (deleted.count !== cartItems.length) {
        throw conflict('Tu carrito cambió mientras se procesaba la compra. Revísalo e inténtalo de nuevo.');
      }

      const created = [];
      for (const item of cartItems) {
        // Se descuenta en la unidad nativa del producto, sin redondear
        // (1 libra de un producto por kilo descuenta 0,4536 kilos). Solo se
        // redondea a 6 decimales para no arrastrar ruido de punto flotante.
        const decrementInProductUnit =
          Math.round(convertWeight(item.quantity, item.unit, item.product.unit) * 1e6) / 1e6;

        // Descuento condicional: solo aplica si todavía hay stock suficiente
        // (y la unidad no cambió). La validación de arriba corre fuera de la
        // transacción y otra compra simultánea pudo agotar el stock desde entonces.
        const updated = await tx.product.updateMany({
          where: {
            id: item.productId,
            unit: item.product.unit,
            quantity: { gte: decrementInProductUnit - 1e-9 },
          },
          data: { quantity: { decrement: decrementInProductUnit } },
        });
        if (updated.count === 0) {
          throw badRequest(`Ya no hay suficiente stock de "${item.product.title}". Revisa tu carrito.`);
        }

        const pricePerItemUnit = Math.round(convertPrice(item.product.price, item.product.unit, item.unit));
        created.push(
          await tx.purchase.create({
            data: {
              userId,
              productId: item.productId,
              quantity: item.quantity,
              unit: item.unit,
              unitPrice: pricePerItemUnit,
            },
          }),
        );
      }

      return created;
    });

    res.status(201).json({ purchasedCount: purchases.length });
  }),
);
