import { z } from 'zod';

export const paymentMethodSchema = z.object({
  bankName: z.string().trim().min(2, 'Ingresa el nombre del banco.'),
  holderName: z.string().trim().min(3, 'Ingresa el nombre del titular.'),
  last4: z.string().trim().regex(/^[0-9]{4}$/, 'Ingresa solo los últimos 4 dígitos de la tarjeta.'),
});

export type PaymentMethodInput = z.infer<typeof paymentMethodSchema>;
