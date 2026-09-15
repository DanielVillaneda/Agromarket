import { z } from 'zod';

export const cartQuantitySchema = z.object({
  quantity: z.coerce.number().int().min(1, 'La cantidad debe ser al menos 1.'),
});
