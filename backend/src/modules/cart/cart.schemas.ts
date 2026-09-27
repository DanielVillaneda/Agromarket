import { z } from 'zod';
import { productUnits } from '../products/product.schemas';

export const cartQuantitySchema = z.object({
  quantity: z.coerce.number().int().min(1, 'La cantidad debe ser al menos 1.'),
  unit: z.enum(productUnits).optional(),
});

// PUT /api/cart/:productId: 0 o menos significa "quitar del carrito".
export const cartUpdateSchema = z.object({
  quantity: z.coerce.number({ invalid_type_error: 'La cantidad debe ser un número.' }).int('La cantidad debe ser un número entero.'),
});
