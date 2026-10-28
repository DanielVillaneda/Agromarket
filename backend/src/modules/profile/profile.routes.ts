import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { asyncHandler } from '../../lib/asyncHandler';
import { requireAuth } from '../../middleware/auth';
import { paymentMethodSchema } from './profile.schemas';

export const profileRouter = Router();

profileRouter.use(requireAuth);

// GET /api/profile/payment-method — método de pago simulado guardado por
// el usuario (solo para mostrarlo en su historial de compras; no procesa
// ningún cobro real ni guarda el número completo de la tarjeta).
profileRouter.get(
  '/payment-method',
  asyncHandler(async (req, res) => {
    const method = await prisma.paymentMethod.findUnique({ where: { userId: req.userId } });
    res.json(method);
  }),
);

// PUT /api/profile/payment-method — crea o reemplaza el método de pago.
profileRouter.put(
  '/payment-method',
  asyncHandler(async (req, res) => {
    const data = paymentMethodSchema.parse(req.body);
    const userId = req.userId!;

    const method = await prisma.paymentMethod.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });

    res.json(method);
  }),
);

// DELETE /api/profile/payment-method — quita el método de pago guardado.
profileRouter.delete(
  '/payment-method',
  asyncHandler(async (req, res) => {
    await prisma.paymentMethod.deleteMany({ where: { userId: req.userId } });
    res.status(204).send();
  }),
);
