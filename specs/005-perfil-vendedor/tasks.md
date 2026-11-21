# Tareas 005: Perfil público del vendedor

Spec: [spec.md](spec.md) · Plan: [plan.md](plan.md)

## T1. Backend (agente-api-backend)

- [x] T1.1 `npx tsc --noEmit` en `backend/` antes de cambiar nada.
- [x] T1.2 Agregar `sellerId` opcional a `listProductsQuerySchema`. En `GET /api/products`, devolver 404 si el vendedor no existe, filtrar por `sellerId` sin ocultar los productos propios y dejar igual el comportamiento sin `sellerId`.
- [x] T1.3 Agregar `GET /api/products/seller/:id` (público), que devuelve `{ id, nombre }` o 404.
- [x] T1.4 Actualizar la tabla de endpoints de `backend/README.md`.
- [x] T1.5 `npx tsc --noEmit` en `backend/` sin errores.

## T2. Frontend (agente-ui-frontend)

- [x] T2.1 `SellerProfile`, `getSellerProducts` y `getSellerProfile` en `products.service.ts`.
- [x] T2.2 Página `/vendedor/:id` (nueva, pública, en `app.routes.ts`): nombre, grilla de `product-card`, mensaje sin productos y mensaje de vendedor inexistente.
- [x] T2.3 Nombre del vendedor como enlace a `/vendedor/:id` en `producto.page.html`.

## T3. Pruebas (agente-pruebas)

- [x] T3.1 Backend: curl documentados para el filtro `sellerId` (con productos, sin productos, inexistente, inválido, sin `sellerId` igual que antes) y para `GET /api/products/seller/:id`.
- [x] T3.2 Frontend: `.spec.ts` para el servicio, la página del perfil (CA1 y CA2) y el enlace del detalle (CA3).
- [x] T3.3 Correr cada spec por separado y comparar contra la línea base tomada antes del cambio: sin regresiones.

## T4. Cierre (orquestador)

- [x] T4.1 `npx tsc --noEmit` en `backend/`.
- [x] T4.2 Anotar en `spec.md` los ajustes respecto al plan y la decisión de no correr agente-e2e completo.
