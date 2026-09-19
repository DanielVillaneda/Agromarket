import { z } from 'zod';
import { productUnits } from '../products/product.schemas';

export const cartQuantitySchema = z.object({
  quantity: z.coerce.number().int().min(1, 'La cantidad debe ser al menos 1.'),
  unit: z.enum(productUnits).optional(),
});
