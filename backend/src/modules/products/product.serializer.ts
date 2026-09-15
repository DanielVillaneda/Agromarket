import { Prisma } from '@prisma/client';

/**
 * Producto con las relaciones que necesitamos para construir la respuesta
 * pública (fotos + datos básicos del vendedor).
 */
const productWithRelations = Prisma.validator<Prisma.ProductDefaultArgs>()({
  include: {
    photos: true,
    seller: { select: { id: true, nombre: true, email: true, telefono: true } },
  },
});

export type ProductWithRelations = Prisma.ProductGetPayload<typeof productWithRelations>;

export const productInclude = productWithRelations.include;

/**
 * Forma en la que el frontend consume un producto (ver `Product` en
 * product-card.component.ts): así el equipo de frontend puede mapear la
 * respuesta casi 1 a 1 al conectar el HttpClient más adelante.
 */
export function serializeProduct(product: ProductWithRelations) {
  return {
    id: product.id,
    title: product.title,
    price: product.price,
    location: product.location,
    icon: product.icon,
    accent: product.accent,
    description: product.description,
    quantity: product.quantity,
    photos: product.photos.map((photo) => photo.url),
    sellerId: product.seller.id,
    sellerName: product.seller.nombre,
    sellerPhone: product.seller.telefono,
    sellerEmail: product.seller.email,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}
