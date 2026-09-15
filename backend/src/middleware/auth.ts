import { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../lib/jwt';
import { unauthorized } from '../lib/httpError';

declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

/**
 * Exige un token JWT válido en el header "Authorization: Bearer <token>".
 * Si es válido, deja el id del usuario en req.userId para que las rutas
 * protegidas lo usen.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;

  if (!token) {
    next(unauthorized('Debes iniciar sesión para hacer esto.'));
    return;
  }

  try {
    const payload = verifyToken(token);
    req.userId = payload.userId;
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
