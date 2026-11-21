# Plan 002: Categoría del producto y filtro en el inicio

Spec: [spec.md](spec.md)

## Decisiones técnicas

- **Modelo de datos:** columna opcional `categoria String?` en `Product`. La migración solo agrega una columna `TEXT` que admite `NULL` (`ALTER TABLE "products" ADD COLUMN "categoria" TEXT`). No es destructiva: los productos existentes quedan con `categoria = NULL`. Se genera con `npx prisma migrate dev --name agregar_categoria_producto`, siguiendo la skill `prisma-safe-migrations`. No se usa un `enum` de Prisma, para que agregar una categoría después no obligue a otra migración del tipo.
- **Valores:** se guardan tal cual se muestran: `"Frutas"`, `"Verduras"`, `"Granos"`, `"Lácteos"` y `"Otros"`.
- **Validación (Zod):** `productCategories = ['Frutas', 'Verduras', 'Granos', 'Lácteos', 'Otros'] as const` en `product.schemas.ts`, y `categoria: z.enum(productCategories).nullable().optional()` en `createProductSchema`. Un valor fuera de la lista responde 400. Una cadena vacía se acepta y se guarda como `null`, para que "sin categoría" tenga un solo valor en la base (igual que `notas` en la spec 001).
- **Semántica al editar (PUT):** `updateProductSchema` hereda el campo por `.partial()`. Si el cuerpo no trae `categoria`, no se toca; si trae `null` o `""`, se borra. El formulario de edición no la envía (fuera de alcance).
- **Respuesta de la API:** `serializeProduct` devuelve `categoria` (`string | null`) en todas las respuestas de producto. `GET /api/products` no cambia: el filtro es del lado del cliente.
- **Filtro en el cliente:** `home.page.ts` tiene un signal `categoriaSeleccionada` (`null` = "Todas") y un `computed` `productosFiltrados` sobre `marketProducts`. El inicio ya carga todos los productos del mercado, así que filtrar en el cliente evita otra petición y otro parámetro en la API.
- **Lista duplicada:** las cinco categorías quedan en `backend/src/modules/products/product.schemas.ts` y en `src/app/services/products.service.ts` (`PRODUCT_CATEGORIES`). Hay que mantener las dos copias sincronizadas, igual que las unidades.
- **Frontend:**
  - `ApiProduct.categoria: ProductCategory | null`, `Product.categoria?: string` y `ProductInput.categoria?: ProductCategory | null`. `mapProduct` convierte `null` en `undefined`.
  - `/vender` agrega un `select` opcional "Categoría (opcional)", con una opción vacía "Sin categoría" y las cinco categorías. Al enviar, el valor vacío se manda como `null`.
  - `product-card` muestra la categoría como etiqueta de texto solo con `@if (product.categoria)`.
  - En el inicio, encima de la grilla de "Lo más reciente", va un grupo de botones ("Todas" y las cinco categorías) con `aria-pressed` en el seleccionado. Si una categoría no tiene productos, se muestra un mensaje vacío propio ("No hay productos en esta categoría.").

## Archivos que se van a tocar

| Capa | Archivo | Cambio |
|---|---|---|
| Datos | `backend/prisma/schema.prisma` | `categoria String?` en `Product` |
| Datos | `backend/prisma/migrations/<fecha>_agregar_categoria_producto/` | Migración generada |
| Backend | `backend/src/modules/products/product.schemas.ts` | `productCategories` y `categoria` en `createProductSchema` (y por `.partial()` en `updateProductSchema`) |
| Backend | `backend/src/modules/products/products.routes.ts` | Pasar `categoria` en el `data` del create y del update |
| Backend | `backend/src/modules/products/product.serializer.ts` | Devolver `categoria` |
| Frontend | `src/app/services/products.service.ts` | `PRODUCT_CATEGORIES`, `ProductCategory`, `ApiProduct`, `ProductInput` y `mapProduct` |
| Frontend | `src/app/components/product-card/product-card.component.ts`, `.html` y `.scss` | `categoria?: string` en el tipo `Product` y etiqueta de categoría |
| Frontend | `src/app/pages/vender/vender.page.ts`, `.html` (y `.scss` si hace falta) | Campo opcional de categoría |
| Frontend | `src/app/pages/home/home.page.ts`, `.html` y `.scss` | Filtro por categoría en "Lo más reciente" |
| Pruebas | `*.spec.ts` en `src/app/**` y curl documentados | Ver `tasks.md` |

`products.routes.ts` no estaba en la lista inicial de la solicitud, pero hace falta por la misma razón que en la spec 001: el create y el update copian los campos uno por uno, así que sin ese cambio `categoria` se validaría pero no se guardaría.

## Orden de delegación (según `CLAUDE.md`)

En secuencia estricta, un agente a la vez:

1. `agente-schema-db`: schema y migración.
2. `agente-api-backend`: `npx tsc --noEmit` después del schema y luego el cambio de backend.
3. `agente-ui-frontend`: tipos, formulario de vender, tarjeta y filtro del inicio, con el contrato del endpoint.
4. `agente-accesibilidad`: revisión de los `.html` y `.scss` que cambió `agente-ui-frontend`.
5. `agente-pruebas`: pruebas desde los criterios de aceptación.

`agente-e2e` no se corre completo: la spec no toca login, recuperación de cuenta, carrito, checkout, pagos ni admin (ver `CLAUDE.md`).
