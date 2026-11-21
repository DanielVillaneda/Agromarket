# Tareas 003: Calificación de productos (de 1 a 5 estrellas)

Spec: [spec.md](spec.md) · Plan: [plan.md](plan.md)

## T1. Schema y migración (agente-schema-db)

- [x] T1.1 Agregar el modelo `Review` (`id`, `productId`, `userId`, `rating Int`, `createdAt`, `@@unique([productId, userId])`, `@@map("reviews")`), con sus relaciones y `reviews Review[]` en `Product` y `User`.
- [x] T1.2 Generar y aplicar la migración `agregar_calificaciones` con `npx prisma migrate dev`, y comprobar que solo crea la tabla, el índice único y las llaves foráneas.

## T2. Backend (agente-api-backend)

- [x] T2.1 `npx tsc --noEmit` en `backend/` después del cambio de schema.
- [x] T2.2 Crear `reviews.schemas.ts` con `rateProductSchema` (`rating` entero de 1 a 5, mensajes en español).
- [x] T2.3 Crear `reviews.routes.ts` con `POST /api/reviews/:productId` (upsert; 201 al crear, 200 al actualizar; 403 si es su propio producto; 404 si no existe) y `GET /api/reviews/:productId` (`{ ratingAverage, ratingCount, myRating }`), y montarlo en `app.ts`.
- [x] T2.4 Incluir `ratingAverage` (1 decimal o `null`) y `ratingCount` en `serializeProduct` (`product.serializer.ts`).
- [x] T2.5 Agregar los dos endpoints a la tabla de `backend/README.md`.
- [x] T2.6 `npx tsc --noEmit` en `backend/` sin errores.

## T3. Frontend (agente-ui-frontend)

- [x] T3.1 Tipos (`ApiProduct`, `Product`) y `mapProduct` con `ratingAverage` y `ratingCount`. Agregar `getRatingSummary` y `rateProduct` en `ProductsService`.
- [x] T3.2 Mostrar el resumen del promedio y la cantidad en `/producto/:id` (o "Aún sin calificaciones").
- [x] T3.3 Agregar el selector de 1 a 5 estrellas en `/producto/:id`: visible solo con sesión y si no es el vendedor, precargado con `myRating`, y que actualiza el resumen al calificar. Registrar los íconos en `icons.ts`.

## T4. Accesibilidad (agente-accesibilidad)

- [x] T4.1 Revisar el resumen y el selector de estrellas (`aria-label` "Calificar con N de 5 estrellas", `aria-pressed`, foco, contraste y anuncio del resultado).

## T5. Pruebas (agente-pruebas)

- [x] T5.1 Backend: curl documentados para CA1 a CA4 contra la API local, más los casos de rating fuera de rango, sin sesión y producto inexistente.
- [x] T5.2 Frontend: `.spec.ts` para el mapeo en `ProductsService`, el resumen y el selector en el detalle (visible o no según la sesión y el dueño, y actualización al calificar).
- [x] T5.3 Correr cada spec por separado y comparar contra la línea base tomada antes del cambio: sin regresiones.

## T6. Cierre (orquestador)

- [x] T6.1 `npx tsc --noEmit` en `backend/`.
- [x] T6.2 Anotar en `spec.md` los ajustes respecto al plan y la decisión de no correr agente-e2e completo.
