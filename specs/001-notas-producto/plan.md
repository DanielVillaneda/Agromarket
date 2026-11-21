# Plan 001: Notas del vendedor en el producto

Spec: [spec.md](spec.md)

## Decisiones técnicas

- **Modelo de datos:** columna opcional `notas String?` en `Product`. La migración solo agrega una columna `TEXT` que admite `NULL` (`ALTER TABLE "products" ADD COLUMN "notas" TEXT`), así que no es destructiva: los productos existentes quedan con `notas = NULL`. Se genera con `npx prisma migrate dev`, siguiendo la skill `prisma-safe-migrations`.
- **Validación (Zod):** `notas` es opcional, se recorta con `trim()` y tiene un máximo de 500 caracteres. Una cadena vacía se guarda como `null`, para que "sin notas" tenga un solo valor en la base.
- **Semántica al editar (PUT):** si el cuerpo no trae `notas`, no se tocan. Si trae `null` o `""`, se borran (`CA4`). Si trae texto, se reemplazan.
- **Respuesta de la API:** `serializeProduct` devuelve `notas` (`string | null`) en todas las respuestas de producto.
- **Frontend:**
  - `ApiProduct.notas: string | null`, `Product.notas?: string` y `ProductInput.notas?: string | null`. `mapProduct` convierte `null` en `undefined`, igual que hace con `description`.
  - Los formularios de vender y editar tienen un `textarea` opcional "Notas para el comprador (opcional)" con `maxlength` de 500. Al enviar, una cadena vacía se manda como `null`.
  - El detalle muestra la sección "Notas del vendedor" debajo de "Descripción", solo con `@if (product.notas)`.
- **Fuera del plan:** `product-card`, el buscador y el panel de admin no cambian.

## Archivos que se van a tocar

| Capa | Archivo | Cambio |
|---|---|---|
| Datos | `backend/prisma/schema.prisma` | `notas String?` en `Product` |
| Datos | `backend/prisma/migrations/<fecha>_agregar_notas_producto/` | Migración generada |
| Backend | `backend/src/modules/products/product.schemas.ts` | `notas` en `createProductSchema` (y por `.partial()` en `updateProductSchema`) |
| Backend | `backend/src/modules/products/products.routes.ts` | Pasar `notas` en el `data` del create y del update |
| Backend | `backend/src/modules/products/product.serializer.ts` | Devolver `notas` |
| Frontend | `src/app/services/products.service.ts` | `ApiProduct`, `ProductInput` y `mapProduct` |
| Frontend | `src/app/components/product-card/product-card.component.ts` | `notas?: string` en el tipo `Product` |
| Frontend | `src/app/pages/vender/vender.page.ts` y `.html` | Campo opcional de notas |
| Frontend | `src/app/pages/producto-vender/producto-vender.page.ts` y `.html` | Campo de notas, precargado al editar |
| Frontend | `src/app/pages/producto/producto.page.html` (y `.scss` si hace falta) | Sección "Notas del vendedor" |
| Pruebas | `*.spec.ts` en `src/app/**` y curl documentados | Ver `tasks.md` |

`products.routes.ts` no estaba en la lista inicial de la solicitud, pero hace falta: el create y el update copian los campos uno por uno, así que sin ese cambio `notas` se validaría pero no se guardaría.

## Orden de delegación (según `CLAUDE.md`)

1. `agente-schema-db`: schema y migración.
2. `agente-api-backend`: `npx tsc --noEmit` y luego el cambio de backend.
3. `agente-ui-frontend`: tipos, formularios y detalle, con el contrato del endpoint.
4. `agente-accesibilidad`: revisión de los `.html` que cambió `agente-ui-frontend`.
5. `agente-pruebas`: pruebas desde los criterios de aceptación.
