# Plan 003: Calificación de productos (de 1 a 5 estrellas)

Spec: [spec.md](spec.md)

## Decisiones técnicas

### Datos

- **Modelo nuevo `Review`** (tabla `reviews`): `id`, `productId`, `userId`, `rating Int` y `createdAt DateTime @default(now())`. No tiene campo de comentario.
- Relaciones con `Product` y `User`, con `onDelete: Cascade`. Hay que agregar `reviews Review[]` en los dos modelos.
- **`@@unique([productId, userId])`**: garantiza en la base una sola calificación por usuario y producto (CA2).
- El rango 1 a 5 se valida en la API con Zod. Prisma no tiene `CHECK` declarativo y no vale la pena una migración con SQL a mano para esto.
- La migración solo crea la tabla nueva, su índice único y sus llaves foráneas. No es destructiva. Se genera con `npx prisma migrate dev --name agregar_calificaciones` siguiendo la skill `prisma-safe-migrations`.
- Al recalificar se actualiza `rating`. `createdAt` conserva la fecha de la primera calificación.

### API: módulo nuevo `backend/src/modules/reviews/`, montado en `/api/reviews`

Tiene solo dos endpoints; no hay ninguno para listar calificaciones individuales.

- **`POST /api/reviews/:productId`** (`requireAuth`), con cuerpo `{ "rating": 1..5 }`:
  - Si el producto no existe: 404 "No encontramos este producto.".
  - Si el usuario es el vendedor: 403 "No puedes calificar tu propio producto." (CA4).
  - Hace un `upsert` por `productId_userId`. Responde **201** si creó la calificación y **200** si actualizó una existente.
  - Cuerpo de la respuesta: `{ ratingAverage, ratingCount, myRating }`.
- **`GET /api/reviews/:productId`** (`attachUserIfPresent`):
  - 404 si el producto no existe.
  - Responde `{ ratingAverage, ratingCount, myRating }`. `myRating` es la calificación del usuario actual, o `null` si no hay sesión o no ha calificado. Sirve para marcar sus estrellas en el detalle.
- **Validación:** `rateProductSchema = z.object({ rating: z.coerce.number().int().min(1).max(5) })`, con mensajes en español. `productId` se parsea con `parseId`.
- **Promedio:** `ratingAverage` se redondea a 1 decimal (`Math.round(avg * 10) / 10`). Es `null` cuando `ratingCount` es 0. El resumen se calcula con `prisma.review.aggregate` (`_avg` y `_count`) en una función compartida del módulo.

### Producto

- `product.serializer.ts`: `productInclude` agrega `reviews: { select: { rating: true } }`, y `serializeProduct` devuelve `ratingAverage` (`number | null`, 1 decimal) y `ratingCount`. Así todas las respuestas de producto los traen, y el detalle no necesita otra petición para el promedio.
- Si se prefiere, la función de redondeo puede compartirse entre el serializer y el módulo `reviews` para que el promedio salga igual en los dos.

### Frontend

- **Tipos:** `ApiProduct.ratingAverage: number | null` y `ratingCount: number`; `Product.ratingAverage?: number` y `Product.ratingCount?: number`. `mapProduct` convierte `null` en `undefined`.
- **`ProductsService`:** `getRatingSummary(productId)` (GET) y `rateProduct(productId, rating)` (POST). Los dos devuelven `{ ratingAverage, ratingCount, myRating }`.
- **`producto.page`:**
  - Debajo del título muestra el resumen. Con calificaciones: "4,3 de 5 · 12 calificaciones" (o "1 calificación"). Sin calificaciones: "Aún sin calificaciones". Las estrellas visuales son decorativas, con `aria-hidden`.
  - Agrega una sección "Califica este producto" con cinco botones de estrella. Cada botón tiene `aria-label="Calificar con N de 5 estrellas"`, y el seleccionado lleva `aria-pressed="true"`.
  - Si hay sesión y no es el vendedor, se ve el selector. Si no hay sesión, se ve un enlace "Inicia sesión para calificar". Si es el vendedor, no se ve nada (CA4).
  - Al cargar, `getRatingSummary` trae `myRating` para marcar las estrellas del usuario. Al calificar, se actualizan el resumen y las estrellas con la respuesta y se muestra "¡Gracias por tu calificación!". Si hay error, se muestra el mensaje de la API.
- **Íconos:** `star` y `star-outline` (y `star-half` si se usa). Se registran en `src/app/icons.ts`.

## Archivos que se van a tocar

| Capa | Archivo | Cambio |
|---|---|---|
| Datos | `backend/prisma/schema.prisma` | Modelo `Review`, más `reviews Review[]` en `Product` y `User` |
| Datos | `backend/prisma/migrations/<fecha>_agregar_calificaciones/` | Migración generada |
| Backend | `backend/src/modules/reviews/reviews.routes.ts` (nuevo) | `POST` y `GET /api/reviews/:productId` |
| Backend | `backend/src/modules/reviews/reviews.schemas.ts` (nuevo) | `rateProductSchema` |
| Backend | `backend/src/app.ts` | Montar `reviewsRouter` en `/api/reviews` |
| Backend | `backend/src/modules/products/product.serializer.ts` | `reviews` en `productInclude`, más `ratingAverage` y `ratingCount` |
| Backend | `backend/README.md` | Las dos filas nuevas en la tabla de endpoints |
| Frontend | `src/app/services/products.service.ts` | Tipos, `mapProduct`, `getRatingSummary` y `rateProduct` |
| Frontend | `src/app/components/product-card/product-card.component.ts` | `ratingAverage?` y `ratingCount?` en el tipo `Product` |
| Frontend | `src/app/pages/producto/producto.page.ts`, `.html` y `.scss` | Resumen y selector de estrellas |
| Frontend | `src/app/icons.ts` | Íconos de estrella |
| Pruebas | `*.spec.ts` en `src/app/**` y curl documentados | Ver `tasks.md` |

`app.ts`, `README.md` e `icons.ts` no estaban en la lista inicial de la solicitud. Hacen falta igual: sin montar el router, el módulo no responde; sin registrar los íconos, las estrellas no se ven; y `CLAUDE.md` pide mantener la tabla de endpoints del README.

## Orden de delegación (según `CLAUDE.md`)

En secuencia estricta, un agente a la vez:

1. `agente-schema-db`: modelo `Review` y migración.
2. `agente-api-backend`: `npx tsc --noEmit` después del schema, luego el módulo `reviews`, el serializer y el README.
3. `agente-ui-frontend`: tipos, servicio y detalle del producto, con el contrato del endpoint.
4. `agente-accesibilidad`: revisión del resumen y del selector de estrellas (`aria-label` "Calificar con N de 5 estrellas").
5. `agente-pruebas`: pruebas desde los criterios de aceptación.

`agente-e2e` no se corre completo: la spec no toca login, recuperación de cuenta, carrito, checkout, pagos ni admin (ver `CLAUDE.md`).
