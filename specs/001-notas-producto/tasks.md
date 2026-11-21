# Tareas 001: Notas del vendedor en el producto

Spec: [spec.md](spec.md) · Plan: [plan.md](plan.md)

## T1. Schema y migración (agente-schema-db)

- [x] T1.1 Agregar `notas String?` a `model Product` en `backend/prisma/schema.prisma`.
- [x] T1.2 Generar y aplicar la migración `agregar_notas_producto` con `npx prisma migrate dev`.
- [x] T1.3 Verificar tipos con `npx tsc --noEmit` en `backend/` (lo corre agente-api-backend, porque agente-schema-db no puede).

## T2. Backend (agente-api-backend)

- [x] T2.1 Agregar `notas` a `createProductSchema` en `product.schemas.ts`: opcional, `trim()`, máximo 500 y `""` convertido a `null`.
- [x] T2.2 Pasar `notas` en el `data` del create y del update en `products.routes.ts`.
- [x] T2.3 Devolver `notas` en `serializeProduct` (`product.serializer.ts`).
- [x] T2.4 `npx tsc --noEmit` en `backend/` sin errores.

## T3. Frontend: tipos y formularios (agente-ui-frontend)

- [x] T3.1 Agregar `notas` a `ApiProduct`, `ProductInput` y `mapProduct` (`products.service.ts`) y al tipo `Product` (`product-card.component.ts`).
- [x] T3.2 Agregar el campo opcional de notas al formulario de `/vender` y enviarlo al crear.
- [x] T3.3 Agregar el campo de notas al formulario de `/producto-vender/:id`, precargarlo al editar y enviarlo al guardar (vacío → `null`).

## T4. Frontend: detalle (agente-ui-frontend, luego agente-accesibilidad)

- [x] T4.1 Mostrar la sección "Notas del vendedor" en `/producto/:id` solo si el producto tiene notas.
- [x] T4.2 Revisión de accesibilidad de los `.html` que cambiaron en T3 y T4.

## T5. Pruebas (agente-pruebas)

- [x] T5.1 Backend: curl documentados para CA1 a CA4 contra la API local.
- [x] T5.2 Frontend: `.spec.ts` para el mapeo de `notas` en `ProductsService` y para la sección del detalle (se muestra con notas, no se muestra sin ellas).
- [x] T5.3 `npx ng test --watch=false` sin regresiones respecto a la línea base.
