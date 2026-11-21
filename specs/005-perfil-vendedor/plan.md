# Plan 005: Perfil público del vendedor

Spec: [spec.md](spec.md)

## Decisiones técnicas

### Backend (sin cambios de datos)

No hay cambios en `schema.prisma` ni migración: el vendedor ya es `Product.sellerId` → `User`.

- **Parámetro opcional `sellerId` en `GET /api/products`** (público; `attachUserIfPresent`, como hoy):
  - `listProductsQuerySchema` agrega `sellerId: z.coerce.number().int().positive().optional()`. Un valor inválido responde 400.
  - Si viene `sellerId`, se busca el usuario. Si no existe: 404 "No encontramos este vendedor.".
  - Si existe, se filtra `where.sellerId = sellerId`. En ese caso **no** se aplica la regla de ocultar los productos propios, porque un vendedor que mira su propio perfil debe ver sus productos.
  - Sin `sellerId`, el comportamiento es idéntico al actual. `q` se puede combinar con `sellerId`.
- **Endpoint nuevo `GET /api/products/seller/:id`** (público, sin autenticación). Devuelve `{ id, nombre }` del vendedor, o 404 "No encontramos este vendedor.". El id se parsea con `parseId`; uno inválido responde 400.
  - *Por qué un endpoint más:* la lista de productos no trae el nombre del vendedor cuando está vacía, y la spec exige mostrarlo también en ese caso (CA1).
  - No expone correo, teléfono ni rol.
  - Se declara antes de `GET /:id` y no choca con él, porque tiene dos segmentos.
- **README:** la fila de `GET /api/products` menciona `?sellerId=`, y se agrega la fila de `GET /api/products/seller/:id`.

### Frontend

- **`ProductsService`:**
  - `getSellerProducts(sellerId): Observable<Product[]>`, que hace GET `/products?sellerId=N` y aplica `mapProduct`.
  - `getSellerProfile(sellerId): Observable<SellerProfile>`, que hace GET `/products/seller/:id`.
  - Exporta `interface SellerProfile { id: number; nombre: string }`.
  - No se guardan en signals del servicio: son datos de una sola página.
- **Página nueva `src/app/pages/vendedor/vendedor.page.{ts,html,scss}`**, standalone y cargada en `app.routes.ts` con `loadComponent` en `path: 'vendedor/:id'`, sin guard.
  - Lee `:id` y pide en paralelo (`forkJoin`) el perfil y los productos. Signals: `vendedor`, `productos`, `cargando` y `error`.
  - **Con productos:** h1 con el nombre y una grilla de `app-product-card` enlazadas a `/producto/:id`, igual que en el inicio.
  - **Sin productos:** h1 con el nombre y "Este vendedor aún no tiene productos en venta.".
  - **404, 400 o id no numérico:** "No encontramos este vendedor.", sin grilla. Un id no numérico no llama a la API.
  - **Otro error:** "No pudimos cargar el perfil del vendedor. Intenta de nuevo.".
  - Si el id de la ruta cambia sin destruir el componente (por ejemplo, de un perfil a otro), se recarga. Se lee de forma reactiva, como en `search.page`.
- **`producto.page.html`:** el nombre del vendedor (`.producto-seller-name`) pasa a ser `<a [routerLink]="['/vendedor', product.sellerId]">`, con un estilo de enlace coherente.

## Archivos que se van a tocar

| Capa | Archivo | Cambio |
|---|---|---|
| Backend | `backend/src/modules/products/product.schemas.ts` | `sellerId` en `listProductsQuerySchema` |
| Backend | `backend/src/modules/products/products.routes.ts` | Filtro `sellerId` con 404 y `GET /seller/:id` |
| Backend | `backend/README.md` | Tabla de endpoints |
| Frontend | `src/app/services/products.service.ts` | `SellerProfile`, `getSellerProducts` y `getSellerProfile` |
| Frontend | `src/app/pages/vendedor/vendedor.page.ts`, `.html` y `.scss` (nuevos) | Página del perfil |
| Frontend | `src/app/app.routes.ts` | Ruta `vendedor/:id` |
| Frontend | `src/app/pages/producto/producto.page.html` (y `.scss`) | Nombre del vendedor como enlace |
| Pruebas | `*.spec.ts` en `src/app/**` y curl documentados | Ver `tasks.md` |

## Orden de delegación (según `CLAUDE.md` y la solicitud)

En secuencia estricta, un agente a la vez:

1. `agente-api-backend`: parámetro `sellerId`, endpoint del vendedor y README, más `npx tsc --noEmit`.
2. `agente-ui-frontend`: servicio, página `/vendedor/:id`, ruta y enlace en el detalle, con el contrato del endpoint.
3. `agente-pruebas`: pruebas desde los criterios de aceptación.

No se usa `agente-schema-db`, porque no hay cambio de datos. Por decisión del desarrollador, en esta spec tampoco se usa `agente-accesibilidad`. `agente-e2e` no se corre completo (ver `CLAUDE.md`).
