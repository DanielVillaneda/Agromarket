import { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../lib/jwt';
import { prisma } from '../lib/prisma';
import { forbidden, unauthorized } from '../lib/httpError';

declare global {
  namespace Express {
    interface Request {
      userId?: number;
      userRole?: string;
    }
  }
}

/**
 * Exige un token JWT válido en el header "Authorization: Bearer <token>".
 * Si es válido, deja el id y el rol del usuario en req.userId/req.userRole
 * para que las rutas protegidas los usen. También revisa que la cuenta no
 * esté bloqueada por un administrador.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;

  if (!token) {
    next(unauthorized('Debes iniciar sesión para hacer esto.'));
    return;
  }

  try {
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, isBlocked: true },
    });

    if (!user) {
      next(unauthorized('Tu sesión expiró o el token no es válido. Inicia sesión de nuevo.'));
      return;
    }

    if (user.isBlocked) {
      next(forbidden('Tu cuenta fue bloqueada. Contacta a soporte si crees que es un error.'));
      return;
    }

    req.userId = user.id;
    req.userRole = user.role;
    next();
  } catch {
    next(unauthorized('Tu sesión expiró o el token no es válido. Inicia sesión de nuevo.'));
  }
}

/**
 * Igual que requireAuth pero no falla si no hay token: solo, si lo hay y es
 * válido, deja el id disponible. Útil para rutas públicas que cambian de
 * comportamiento si el usuario está identificado (por ejemplo, la lista de
 * productos del mercado, que no debe incluir los productos propios).
 */
export function attachUserIfPresent(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;

  if (!token) {
    next();
    return;
  }

  try {
    const payload = verifyToken(token);
    req.userId = payload.userId;
  } catch {
    // Token inválido en una ruta opcional: se ignora y sigue como anónimo.
  }

  next();
}

/** Exige que requireAuth ya haya corrido antes y que el usuario sea admin. */
export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (req.userRole !== 'admin') {
    next(forbidden('No tienes permisos de administrador.'));
    return;
  }
  next();
}
