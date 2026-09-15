import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { asyncHandler } from '../../lib/asyncHandler';
import { hashPassword, comparePassword } from '../../lib/password';
import { signToken } from '../../lib/jwt';
import { conflict, notFound, unauthorized } from '../../lib/httpError';
import { requireAuth } from '../../middleware/auth';
import { loginSchema, registroSchema } from './auth.schemas';

export const authRouter = Router();

function publicUser(user: { id: number; nombre: string; email: string; telefono: string }) {
  return { id: user.id, nombre: user.nombre, email: user.email, telefono: user.telefono };
}

// POST /api/auth/registro — corresponde a registroForm en login.page.ts
authRouter.post(
  '/registro',
  asyncHandler(async (req, res) => {
    const data = registroSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw conflict('Ya existe una cuenta registrada con ese correo.');
    }

    const passwordHash = await hashPassword(data.password);
    const user = await prisma.user.create({
      data: {
        nombre: data.nombre,
        email: data.email,
        telefono: data.telefono,
        passwordHash,
      },
    });

    const token = signToken({ userId: user.id });
    res.status(201).json({ token, user: publicUser(user) });
  }),
);

// POST /api/auth/login — corresponde a loginForm en login.page.ts
authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      throw unauthorized('Correo o contraseña incorrectos.');
    }

    const passwordOk = await comparePassword(data.password, user.passwordHash);
    if (!passwordOk) {
      throw unauthorized('Correo o contraseña incorrectos.');
    }

    const token = signToken({ userId: user.id });
    res.json({ token, user: publicUser(user) });
  }),
);

// GET /api/auth/me — recupera el usuario dueño del token (para mantener la
// sesión iniciada al recargar la app).
authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      throw notFound('Usuario no encontrado.');
    }
    res.json({ user: publicUser(user) });
  }),
);
