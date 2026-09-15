import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { asyncHandler } from '../../lib/asyncHandler';
import { requireAuth } from '../../middleware/auth';
import { productInclude, serializeProduct } from '../products/product.serializer';
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

    const mapped = items.map((item) => ({
      product: serializeProduct(item.product),
      quantity: item.quantity,
    }));

    const total = mapped.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const count = mapped.reduce((sum, item) => sum + item.quantity, 0);

    res.json({ items: mapped, total, count });
  }),
);

// POST /api/cart/:productId — equivalente a addToCart (suma unidades si ya
// estaba en el carrito).
cartRouter.post(
  '/:productId',
  asyncHandler(async (req, res) => {
    const productId = Number(req.params.productId);
    const userId = req.userId!;
    const { quantity } = cartQuantitySchema.parse({ quantity: req.body.quantity ?? 1 });

    const existing = await prisma.cartItem.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    const item = await prisma.cartItem.upsert({
      where: { userId_productId: { userId, productId } },
      create: { userId, productId, quantity },
      update: { quantity: (existing?.quantity ?? 0) + quantity },
    });

    res.status(201).json({ quantity: item.quantity });
  }),
);

// PUT /api/cart/:productId — equivalente a updateCartQuantity (si la
// cantidad llega a 0 o menos, se elimina del carrito).
cartRouter.put(
  '/:productId',
  asyncHandler(async (req, res) => {
    const productId = Number(req.params.productId);
    const userId = req.userId!;
    const quantity = Number(req.body.quantity);

    if (!quantity || quantity <= 0) {
      await prisma.cartItem.deleteMany({ where: { userId, productId } });
      res.json({ quantity: 0 });
      return;
    }

    const item = await prisma.cartItem.upsert({
      where: { userId_productId: { userId, productId } },
      create: { userId, productId, quantity },
      update: { quantity },
    });

    res.json({ quantity: item.quantity });
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
