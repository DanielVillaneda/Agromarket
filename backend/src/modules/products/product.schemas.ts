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

export const productCategories = ['Frutas', 'Verduras', 'Granos', 'Lácteos', 'Otros'] as const;
export type ProductCategory = (typeof productCategories)[number];

// Corresponde a los campos del formulario de vender.page.ts / producto-vender.page.ts
export const createProductSchema = z.object({
  title: z.string().trim().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  price: z.coerce.number().int().positive('El precio debe ser mayor a 0.'),
  location: z.string().trim().min(1, 'Ingresa tu ubicación.'),
  description: z.string().trim().min(10, 'Escribe al menos 10 caracteres.'),
  // Puede tener decimales: tras vender en otra unidad (ej. 1 libra de un producto
  // por kilo) el stock restante queda fraccionado y el vendedor debe poder editarlo.
  quantity: z.coerce.number().positive('Debe ser mayor a 0.'),
  // Notas opcionales del vendedor: "" (o solo espacios) y null se guardan como null;
  // si no se envía, queda undefined y no se toca la columna.
  notas: z
    .string()
    .trim()
    .max(500, 'Las notas pueden tener máximo 500 caracteres.')
    .transform((valor) => (valor === '' ? null : valor))
    .nullable()
    .optional(),
  // Categoría opcional: "" y null se guardan como null; si no se envía, queda
  // undefined y no se toca la columna. Cualquier otro valor debe estar en la lista.
  categoria: z
    .string()
    .trim()
    .transform((valor) => (valor === '' ? null : valor))
    .nullable()
    .refine((valor) => valor === null || (productCategories as readonly string[]).includes(valor), {
      message: 'Elige una categoría válida.',
    })
    .optional(),
  unit: z.enum(productUnits).optional(),
  icon: z.string().trim().optional(),
  accent: z.string().trim().optional(),
  // Toda publicación necesita al menos una foto (en la edición, si se envían
  // fotos, tampoco puede quedar la lista vacía).
  photos: z.array(z.string().trim().min(1)).min(1, 'Agrega al menos una foto del producto.'),
});

export const updateProductSchema = createProductSchema.partial();

export const listProductsQuerySchema = z.object({
  q: z.string().trim().optional(),
  includeMine: z.coerce.boolean().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
