import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { asyncHandler } from '../../lib/asyncHandler';
import { badRequest, notFound } from '../../lib/httpError';
import { requireAuth } from '../../middleware/auth';
import { productInclude, serializeProduct } from '../products/product.serializer';
import { productUnitLabels, productUnits, ProductUnit } from '../products/product.schemas';
import { canConvert, convertPrice, convertWeight, formatAmount } from '../../lib/units';
import { cartQuantitySchema } from './cart.schemas';

export const cartRouter = Router();

cartRouter.use(requireAuth);

// GET /api/cart — equivalente a cartItems + cartTotal + cartCount.
cartRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const items = await prisma.cartItem.findMany({
      where: { userId: req.userId },
      include: { product: { include: productInclude } },
      orderBy: { updatedAt: 'desc' },
    });

    // Si el vendedor bajó el stock (o cambió la unidad del producto a algo
    // ya no convertible) después de que ya estaba en el carrito, se ajusta
    // aquí (y se persiste) para que nunca se muestre ni se cobre más de lo
    // que realmente hay disponible.
    for (const item of items) {
      if (!canConvert(item.unit, item.product.unit)) {
        await prisma.cartItem.delete({ where: { id: item.id } });
        item.quantity = 0;
        continue;
      }

      const inProductUnit = convertWeight(item.quantity, item.unit, item.product.unit);
      if (inProductUnit > item.product.quantity + 1e-9) {
        const clampedInItemUnit = Math.max(
          0,
          Math.floor(convertWeight(item.product.quantity, item.product.unit, item.unit)),
        );
        await prisma.cartItem.update({ where: { id: item.id }, data: { quantity: clampedInItemUnit } });
        item.quantity = clampedInItemUnit;
      }
    }

    const withStock = items.filter((item) => item.quantity > 0);

    const mapped = withStock.map((item) => ({
      product: serializeProduct(item.product),
      quantity: item.quantity,
      unit: item.unit,
    }));

    const total = mapped.reduce((sum, item) => {
      const pricePerItemUnit = Math.round(convertPrice(item.product.price, item.product.unit, item.unit));
      return sum + pricePerItemUnit * item.quantity;
    }, 0);
    // Cantidad de PRODUCTOS distintos en el carrito, no la suma de unidades
    // (2 kilos de un mismo producto cuenta como 1; dos productos distintos
    // cuentan como 2).
    const count = mapped.length;

    res.json({ items: mapped, total, count });
  }),
);

// POST /api/cart/:productId — equivalente a addToCart (suma unidades si ya
// estaba en el carrito). El comprador puede pedir en una unidad distinta a
// la del vendedor si ambas son de peso (kilo/tonelada/libra); la unidad
// queda fija la primera vez que se agrega el producto.
cartRouter.post(
  '/:productId',
  asyncHandler(async (req, res) => {
    const productId = Number(req.params.productId);
    const userId = req.userId!;
    const { quantity, unit: requestedUnit } = cartQuantitySchema.parse({
      quantity: req.body.quantity ?? 1,
      unit: req.body.unit,
    });

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw notFound('No encontramos este producto.');
    }

    const existing = await prisma.cartItem.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    const itemUnit = existing?.unit ?? requestedUnit ?? product.unit;
    const itemUnitLabel = productUnitLabels[itemUnit as ProductUnit] ?? itemUnit;

    if (!canConvert(itemUnit, product.unit)) {
      throw badRequest(`No puedes comprar este producto en ${itemUnitLabel}.`);
    }

    const nextQuantity = (existing?.quantity ?? 0) + quantity;
    const nextQuantityInProductUnit = convertWeight(nextQuantity, itemUnit, product.unit);

    if (nextQuantityInProductUnit > product.quantity + 1e-9) {
      const maxInItemUnit = convertWeight(product.quantity, product.unit, itemUnit);
      throw badRequest(`Solo hay ${formatAmount(maxInItemUnit)} ${itemUnitLabel} disponibles de este producto.`);
    }

    const item = await prisma.cartItem.upsert({
      where: { userId_productId: { userId, productId } },
      create: { userId, productId, quantity, unit: itemUnit },
      update: { quantity: nextQuantity, unit: itemUnit },
    });

    res.status(201).json({ quantity: item.quantity, unit: item.unit });
  }),
);

// PUT /api/cart/:productId — equivalente a updateCartQuantity (si la
// cantidad llega a 0 o menos, se elimina del carrito). Si el body trae
// `unit` y difiere de la que ya tenía el ítem, se cambia la unidad del
// ítem a esa (la cantidad enviada se interpreta ya en la unidad nueva) —
// así el comprador puede pasar de libras a kilos sin tener que quitar el
// producto del carrito primero.
cartRouter.put(
  '/:productId',
  asyncHandler(async (req, res) => {
    const productId = Number(req.params.productId);
    const userId = req.userId!;
    const quantity = Number(req.body.quantity);
    const requestedUnit =
      typeof req.body.unit === 'string' && (productUnits as readonly string[]).includes(req.body.unit)
        ? (req.body.unit as ProductUnit)
        : undefined;

    if (!quantity || quantity <= 0) {
      await prisma.cartItem.deleteMany({ where: { userId, productId } });
      res.json({ quantity: 0 });
      return;
    }

    const [product, existing] = await Promise.all([
      prisma.product.findUnique({ where: { id: productId } }),
      prisma.cartItem.findUnique({ where: { userId_productId: { userId, productId } } }),
    ]);

    if (!product) {
      throw notFound('No encontramos este producto.');
    }

    const itemUnit = requestedUnit ?? existing?.unit ?? product.unit;
    const itemUnitLabel = productUnitLabels[itemUnit as ProductUnit] ?? itemUnit;

    if (!canConvert(itemUnit, product.unit)) {
      throw badRequest(`No puedes comprar este producto en ${itemUnitLabel}.`);
    }

    const quantityInProductUnit = convertWeight(quantity, itemUnit, product.unit);
    if (quantityInProductUnit > product.quantity + 1e-9) {
      const maxInItemUnit = convertWeight(product.quantity, product.unit, itemUnit);
      throw badRequest(`Solo hay ${formatAmount(maxInItemUnit)} ${itemUnitLabel} disponibles de este producto.`);
    }

    const item = await prisma.cartItem.upsert({
      where: { userId_productId: { userId, productId } },
      create: { userId, productId, quantity, unit: itemUnit },
      update: { quantity, unit: itemUnit },
    });

    res.json({ quantity: item.quantity, unit: item.unit });
  }),
);

// DELETE /api/cart/:productId — equivalente a removeFromCart.
cartRouter.delete(
  '/:productId',
  asyncHandler(async (req, res) => {
    const productId = Number(req.params.productId);
    await prisma.cartItem.deleteMany({ where: { userId: req.userId, productId } });
    res.status(204).send();
  }),
);

// DELETE /api/cart — equivalente a clearCart.
cartRouter.delete(
  '/',
  asyncHandler(async (req, res) => {
    await prisma.cartItem.deleteMany({ where: { userId: req.userId } });
    res.status(204).send();
  }),
);
