# Tareas 002: Categoría del producto y filtro en el inicio

Spec: [spec.md](spec.md) · Plan: [plan.md](plan.md)

## T1. Schema y migración (agente-schema-db)

- [x] T1.1 Agregar `categoria String?` a `model Product` en `backend/prisma/schema.prisma`.
- [x] T1.2 Generar y aplicar la migración `agregar_categoria_producto` con `npx prisma migrate dev`, y comprobar que solo agrega una columna `TEXT` que admite `NULL`.

## T2. Backend (agente-api-backend)

- [x] T2.1 `npx tsc --noEmit` en `backend/` después del cambio de schema.
- [x] T2.2 Agregar `productCategories` y `categoria` a `createProductSchema` en `product.schemas.ts`: `z.enum` con los cinco valores, opcional, `null` permitido y `""` convertido a `null`.
- [x] T2.3 Pasar `categoria` en el `data` del create y del update en `products.routes.ts`.
- [x] T2.4 Devolver `categoria` en `serializeProduct` (`product.serializer.ts`).
- [x] T2.5 `npx tsc --noEmit` en `backend/` sin errores.

## T3. Frontend (agente-ui-frontend)

- [x] T3.1 Agregar `PRODUCT_CATEGORIES` y `ProductCategory`, y `categoria` en `ApiProduct`, `ProductInput` y `mapProduct` (`products.service.ts`) y en el tipo `Product` (`product-card.component.ts`).
- [x] T3.2 Agregar el campo opcional de categoría al formulario de `/vender` y enviarlo al crear (vacío → `null`).
- [x] T3.3 Mostrar la categoría en `product-card` solo si el producto la tiene.
- [x] T3.4 Agregar el filtro por categoría ("Todas" y las cinco categorías) en "Lo más reciente" del inicio, con su mensaje cuando una categoría no tiene productos.

## T4. Accesibilidad (agente-accesibilidad)

- [x] T4.1 Revisar los `.html` y `.scss` que cambiaron en T3 (formulario de vender, tarjeta y filtro del inicio).

## T5. Pruebas (agente-pruebas)

- [x] T5.1 Backend: curl documentados para CA1 y CA4 (crear con categoría, sin categoría y con una categoría inválida) contra la API local.
- [x] T5.2 Frontend: `.spec.ts` para el mapeo de `categoria` en `ProductsService`, la etiqueta en `product-card`, el envío desde `/vender` y el filtro del inicio (CA2, CA3 y CA4).
- [x] T5.3 Correr cada spec por separado y comparar contra la línea base tomada antes del cambio: sin regresiones.

## T6. Cierre (orquestador)

- [x] T6.1 `npx tsc --noEmit` en `backend/`.
- [x] T6.2 Anotar en `spec.md` los ajustes respecto al plan y la decisión de no correr agente-e2e completo.
