import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { asyncHandler } from '../../lib/asyncHandler';
import { forbidden, notFound } from '../../lib/httpError';
import { requireAuth, attachUserIfPresent } from '../../middleware/auth';
import { productInclude, serializeProduct } from './product.serializer';
import { createProductSchema, listProductsQuerySchema, updateProductSchema } from './product.schemas';

export const productsRouter = Router();

// GET /api/products?q=texto — equivalente a marketProducts / searchProducts
// del ProductsService. Si hay sesión, no incluye los productos propios (así
// el usuario no se ve a sí mismo como comprador en su propio mercado).
productsRouter.get(
  '/',
  attachUserIfPresent,
  asyncHandler(async (req, res) => {
    const { q } = listProductsQuerySchema.parse(req.query);

    const products = await prisma.product.findMany({
      where: {
        ...(req.userId ? { sellerId: { not: req.userId } } : {}),
        ...(q ? { title: { contains: q, mode: 'insensitive' } } : {}),
      },
      include: productInclude,
      orderBy: { createdAt: 'desc' },
    });

    res.json(products.map(serializeProduct));
  }),
);

// GET /api/products/mine — equivalente a myProducts (página "Venta").
productsRouter.get(
  '/mine',
  requireAuth,
  asyncHandler(async (req, res) => {
    const products = await prisma.product.findMany({
      where: { sellerId: req.userId },
      include: productInclude,
      orderBy: { createdAt: 'desc' },
    });

    res.json(products.map(serializeProduct));
  }),
);

// GET /api/products/:id — detalle de un producto (público). Si hay sesión,
// registra la visita para "vistos recientemente".
productsRouter.get(
  '/:id',
  attachUserIfPresent,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);

    const product = await prisma.product.findUnique({ where: { id }, include: productInclude });
    if (!product) {
      throw notFound('No encontramos este producto.');
    }

    if (req.userId) {
      await prisma.recentlyViewed.upsert({
        where: { userId_productId: { userId: req.userId, productId: id } },
        create: { userId: req.userId, productId: id },
        update: { viewedAt: new Date() },
      });
    }

    res.json(serializeProduct(product));
  }),
);

// POST /api/products — equivalente al formulario de vender.page.ts.
productsRouter.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = createProductSchema.parse(req.body);

    const product = await prisma.product.create({
      data: {
        title: data.title,
        price: data.price,
        location: data.location,
        description: data.description,
        quantity: data.quantity,
        icon: data.icon,
        accent: data.accent,
        sellerId: req.userId!,
        photos: data.photos ? { create: data.photos.map((url) => ({ url })) } : undefined,
      },
      include: productInclude,
    });

    res.status(201).json(serializeProduct(product));
  }),
);

// PUT /api/products/:id — equivalente a producto-vender.page.ts (onSave).
// Solo el vendedor dueño del producto puede editarlo.
productsRouter.put(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const data = updateProductSchema.parse(req.body);

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw notFound('No encontramos este producto.');
    }
    if (existing.sellerId !== req.userId) {
      throw forbidden('Solo el vendedor puede editar este producto.');
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        title: data.title,
        price: data.price,
        location: data.location,
        description: data.description,
        quantity: data.quantity,
        icon: data.icon,
        accent: data.accent,
        ...(data.photos
          ? { photos: { deleteMany: {}, create: data.photos.map((url) => ({ url })) } }
          : {}),
      },
      include: productInclude,
    });

    res.json(serializeProduct(product));
  }),
);

// DELETE /api/products/:id — equivalente a producto-vender.page.ts (onDelete).
productsRouter.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw notFound('No encontramos este producto.');
    }
    if (existing.sellerId !== req.userId) {
      throw forbidden('Solo el vendedor puede eliminar este producto.');
    }

    await prisma.product.delete({ where: { id } });
    res.status(204).send();
  }),
);
