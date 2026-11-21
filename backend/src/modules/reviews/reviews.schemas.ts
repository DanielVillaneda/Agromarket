import { z } from 'zod';

const mensajeCalificacion = 'La calificación debe ser un número entero de 1 a 5.';

// POST /api/reviews/:productId: calificación entera de 1 a 5 (solo número JSON, sin coerción).
export const rateProductSchema = z.object({
  rating: z
    .number({ invalid_type_error: mensajeCalificacion, required_error: mensajeCalificacion })
    .int(mensajeCalificacion)
    .min(1, mensajeCalificacion)
    .max(5, mensajeCalificacion),
});
