import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { asyncHandler } from '../../lib/asyncHandler';
import { parseId } from '../../lib/params';
import { badRequest, notFound } from '../../lib/httpError';
import { requireAdmin, requireAuth } from '../../middleware/auth';
import { productInclude, serializeProduct } from '../products/product.serializer';
import { z } from 'zod';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

function publicUser(user: {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  role: string;
  isBlocked: boolean;
  createdAt: Date;
}) {
  return {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    telefono: user.telefono,
    role: user.role,
    isBlocked: user.isBlocked,
    createdAt: user.createdAt,
  };
}

// GET /api/admin/stats — totales generales de la plataforma.
adminRouter.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const [usersCount, productsCount, purchases] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.purchase.findMany({ select: { quantity: true, unitPrice: true } }),
    ]);

    const totalSales = purchases.reduce((sum, purchase) => sum + purchase.quantity * purchase.unitPrice, 0);

    res.json({
      usersCount,
      productsCount,
      purchasesCount: purchases.length,
      totalSales,
    });
  }),
);

// GET /api/admin/users — todos los usuarios registrados.
adminRouter.get(
  '/users',
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(users.map(publicUser));
  }),
);

// PATCH /api/admin/users/:id/bloqueo — bloquea o desbloquea una cuenta.
adminRouter.patch(
  '/users/:id/bloqueo',
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const { blocked } = z.object({ blocked: z.boolean() }).parse(req.body);

    if (id === req.userId) {
      throw badRequest('No puedes bloquear tu propia cuenta de administrador.');
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw notFound('Usuario no encontrado.');
    }

    const updated = await prisma.user.update({ where: { id }, data: { isBlocked: blocked } });
    res.json(publicUser(updated));
  }),
);

// GET /api/admin/products — todos los productos publicados en la plataforma.
adminRouter.get(
  '/products',
  asyncHandler(async (_req, res) => {
    const products = await prisma.product.findMany({
      include: productInclude,
      orderBy: { createdAt: 'desc' },
    });
    res.json(products.map(serializeProduct));
  }),
);

// DELETE /api/admin/products/:id — modera (elimina) cualquier producto.
adminRouter.delete(
  '/products/:id',
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw notFound('No encontramos este producto.');
    }

    await prisma.product.delete({ where: { id } });
    res.status(204).send();
  }),
);
