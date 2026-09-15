import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { HttpError } from '../lib/httpError';

/**
 * Middleware de errores centralizado. Traduce errores conocidos (HttpError,
 * validaciones de zod, errores de Prisma con código conocido) a una
 * respuesta JSON consistente, y evita filtrar detalles internos en
 * cualquier otro caso inesperado.
 */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ message: err.message });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      message: 'Datos inválidos.',
      errors: err.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    });
    return;
  }

  if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === 'P2002') {
    res.status(409).json({ message: 'Ese registro ya existe (valor duplicado).' });
    return;
  }

  console.error(err);
  res.status(500).json({ message: 'Error interno del servidor.' });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ message: 'Ruta no encontrada.' });
}
