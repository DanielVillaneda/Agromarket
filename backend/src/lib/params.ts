import { z } from 'zod';
import { badRequest } from './httpError';

const idSchema = z.coerce.number().int().positive();

/**
 * Convierte un parámetro de ruta (ej. `:id`, `:productId`) en un id numérico
 * válido. Si no lo es, responde 400 en vez de dejar que Prisma falle con 500.
 */
export function parseId(value: string): number {
  const result = idSchema.safeParse(value);
  if (!result.success) {
    throw badRequest('El id debe ser un número entero positivo.');
  }
  return result.data;
}
