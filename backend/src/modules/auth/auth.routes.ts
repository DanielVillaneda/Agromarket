import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { asyncHandler } from '../../lib/asyncHandler';
import { hashPassword, comparePassword } from '../../lib/password';
import { signToken } from '../../lib/jwt';
import { badRequest, conflict, forbidden, notFound, unauthorized } from '../../lib/httpError';
import { requireAuth } from '../../middleware/auth';
import { sendRecoveryCodeEmail } from '../../lib/mailer';
import {
  loginSchema,
  registroSchema,
  restablecerPasswordSchema,
  solicitarRecuperacionSchema,
  verificarCodigoSchema,
} from './auth.schemas';

export const authRouter = Router();

const RESET_CODE_TTL_MS = 15 * 60 * 1000;

function publicUser(user: { id: number; nombre: string; email: string; telefono: string; role: string }) {
  return { id: user.id, nombre: user.nombre, email: user.email, telefono: user.telefono, role: user.role };
}

/**
 * Busca un usuario por correo ignorando mayúsculas. `email` ya llega en
 * minúsculas (ver emailSchema), pero los usuarios antiguos pueden tenerlo
 * guardado con mayúsculas y no se migran. Se usa LOWER(email) = $1 en vez
 * de `mode: 'insensitive'` porque este último usa ILIKE, donde "_" y "%"
 * actúan como comodines (y "_" es común en correos). Si por datos viejos
 * hubiera dos cuentas que solo difieren en mayúsculas, se toma la más
 * antigua para que el resultado sea siempre el mismo.
 */
async function findUserByEmail(email: string) {
  const rows = await prisma.$queryRaw<{ id: number }[]>`
    SELECT id FROM users WHERE LOWER(email) = ${email} ORDER BY id LIMIT 1`;
  return rows.length > 0 ? prisma.user.findUnique({ where: { id: rows[0].id } }) : null;
}

function generateSixDigitCode(): string {
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');
}

// POST /api/auth/registro — corresponde a registroForm en login.page.ts
authRouter.post(
  '/registro',
  asyncHandler(async (req, res) => {
    const data = registroSchema.parse(req.body);

    const existing = await findUserByEmail(data.email);
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

    const user = await findUserByEmail(data.email);
    if (!user) {
      throw unauthorized('Correo o contraseña incorrectos.');
    }

    const passwordOk = await comparePassword(data.password, user.passwordHash);
    if (!passwordOk) {
      throw unauthorized('Correo o contraseña incorrectos.');
    }

    if (user.isBlocked) {
      throw forbidden('Tu cuenta fue bloqueada. Contacta a soporte si crees que es un error.');
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

// POST /api/auth/recuperar — genera un código de 6 dígitos y lo envía por
// correo. Responde el mismo mensaje exista o no la cuenta, para no revelar
// qué correos están registrados.
authRouter.post(
  '/recuperar',
  asyncHandler(async (req, res) => {
    const { email } = solicitarRecuperacionSchema.parse(req.body);

    const user = await findUserByEmail(email);

    if (user) {
      const code = generateSixDigitCode();
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetCode: code,
          passwordResetExpiresAt: new Date(Date.now() + RESET_CODE_TTL_MS),
        },
      });
      await sendRecoveryCodeEmail(user.email, code);
    }

    res.json({ message: 'Si el correo está registrado, te enviamos un código de verificación.' });
  }),
);

// POST /api/auth/recuperar/verificar — confirma que el código ingresado es
// válido antes de mostrar el formulario de nueva contraseña.
authRouter.post(
  '/recuperar/verificar',
  asyncHandler(async (req, res) => {
    const { email, code } = verificarCodigoSchema.parse(req.body);

    const user = await findUserByEmail(email);
    const isValid =
      !!user &&
      user.passwordResetCode === code &&
      !!user.passwordResetExpiresAt &&
      user.passwordResetExpiresAt.getTime() > Date.now();

    if (!isValid) {
      throw badRequest('El código es inválido o expiró. Solicita uno nuevo.');
    }

    res.json({ valid: true });
  }),
);

// POST /api/auth/recuperar/restablecer — vuelve a validar el código (nunca
// se confía solo en lo que pasó en /verificar) y cambia la contraseña.
authRouter.post(
  '/recuperar/restablecer',
  asyncHandler(async (req, res) => {
    const { email, code, password } = restablecerPasswordSchema.parse(req.body);

    const user = await findUserByEmail(email);
    const isValid =
      !!user &&
      user.passwordResetCode === code &&
      !!user.passwordResetExpiresAt &&
      user.passwordResetExpiresAt.getTime() > Date.now();

    if (!isValid) {
      throw badRequest('El código es inválido o expiró. Solicita uno nuevo.');
    }

    const passwordHash = await hashPassword(password);
    await prisma.user.update({
      where: { id: user!.id },
      data: { passwordHash, passwordResetCode: null, passwordResetExpiresAt: null },
    });

    res.json({ message: 'Tu contraseña se actualizó. Ya puedes iniciar sesión.' });
  }),
);
