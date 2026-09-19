import { z } from 'zod';

export const productUnits = ['kilo', 'tonelada', 'libra', 'litro', 'unidad'] as const;
export type ProductUnit = (typeof productUnits)[number];

export const productUnitLabels: Record<ProductUnit, string> = {
  kilo: 'kilos',
  tonelada: 'toneladas',
  libra: 'libras',
  litro: 'litros',
  unidad: 'unidades',
};

// Corresponde a los campos del formulario de vender.page.ts / producto-vender.page.ts
export const createProductSchema = z.object({
  title: z.string().trim().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  price: z.coerce.number().int().positive('El precio debe ser mayor a 0.'),
  location: z.string().trim().min(1, 'Ingresa tu ubicación.'),
  description: z.string().trim().min(10, 'Escribe al menos 10 caracteres.'),
  quantity: z.coerce.number().int().min(1, 'Debe ser al menos 1.'),
  unit: z.enum(productUnits).optional(),
  icon: z.string().trim().optional(),
  accent: z.string().trim().optional(),
  photos: z.array(z.string().trim().min(1)).optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const listProductsQuerySchema = z.object({
  q: z.string().trim().optional(),
  includeMine: z.coerce.boolean().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
