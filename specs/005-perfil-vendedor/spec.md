# Spec 005: Perfil público del vendedor

## Qué se construye

Una página pública **`/vendedor/:id`** que muestra el **nombre del vendedor** y **sus productos en venta**, con las mismas tarjetas del resto de la app. Si el vendedor no tiene productos, se ve un mensaje en lugar de una lista vacía. No hace falta iniciar sesión para verla.

En el detalle de un producto (`/producto/:id`), el **nombre del vendedor** pasa a ser un enlace a su perfil.

Es una versión recortada: solo se muestran el nombre y los productos.

## Por qué

Hoy el comprador ve el nombre del vendedor en el detalle de un producto, pero no puede ver qué más vende. El perfil le permite descubrir otros productos del mismo productor y, si ya confía en él, comprarle más.

## Fuera de alcance

- Datos de contacto, ubicación, foto, descripción o fecha de registro en el perfil. El correo y el teléfono siguen apareciendo solo en el detalle del producto, como hoy.
- Calificación promedio del vendedor.
- Que el vendedor edite su perfil público.
- Enlazar el perfil desde la tarjeta del producto, el inicio o el buscador.
- Paginación, filtros u orden dentro del perfil.

## Criterios de aceptación

**CA1: el perfil de un vendedor muestra sus productos, o un mensaje si no tiene**
- **Given** un vendedor con productos publicados
- **When** cualquier persona, con o sin sesión, entra a `/vendedor/:id`
- **Then** ve el nombre del vendedor y una tarjeta por cada uno de sus productos (y ninguno de otros vendedores). Y si el vendedor no tiene productos, ve su nombre y el mensaje "Este vendedor aún no tiene productos en venta." en lugar de una lista vacía.

**CA2: un vendedor que no existe muestra un error claro**
- **Given** un id que no corresponde a ningún usuario (o que no es un número)
- **When** alguien entra a `/vendedor/:id` con ese id
- **Then** ve el mensaje "No encontramos este vendedor." y ninguna lista de productos. La API responde 404 para un id que no existe.

**CA3: desde el detalle de un producto se llega al perfil del vendedor**
- **Given** el detalle de un producto (`/producto/:id`)
- **When** el comprador hace clic en el nombre del vendedor
- **Then** llega a `/vendedor/<id del vendedor>` y ve el perfil de ese vendedor.

## Ajustes durante la implementación

- **Endpoint extra `GET /api/products/seller/:id`.** La solicitud pedía solo el parámetro `sellerId` en `GET /api/products`. Pero con un vendedor sin productos la lista llega vacía y no trae su nombre, y CA1 exige mostrarlo. Por eso se agregó este endpoint público, que devuelve solo `{ id, nombre }` (sin correo, teléfono ni rol).
- **Con `sellerId` no se ocultan los productos propios.** Un vendedor que mira su propio perfil ve sus productos. Sin `sellerId`, `GET /api/products` sigue excluyéndolos, como antes.
- **Bug encontrado y corregido: ids fuera del rango Int32 respondían 500.** agente-pruebas encontró que `?sellerId=2147483648`, `/api/products/seller/2147483648` y, desde antes de esta spec, `/api/products/2147483648` devolvían "Error interno del servidor.". La causa era que Zod no ponía tope y PostgreSQL rechazaba el número.
  - agente-api-backend agregó `.max(2147483647)` en `listProductsQuerySchema.sellerId` y en `lib/params.parseId`.
  - El cambio en `lib/` está fuera de su alcance habitual y se hizo con la autorización del desarrollador.
  - Ahora los tres casos responden 400. Como `parseId` lo usan todos los módulos, el arreglo también cubre las demás rutas con id.
- **Sin agente-accesibilidad.** En esta spec no se usó, por decisión del desarrollador. El enlace del vendedor tiene `focus-visible`, y los mensajes de carga y error usan `role="status"` y `role="alert"`.
- **No se corrió agente-e2e completo.** La spec no toca flujos críticos (ver `CLAUDE.md`). CA1 a CA3 quedaron cubiertos con curl contra la API local y con specs de frontend (ver `tasks.md`, T3).
- **Pendientes no bloqueantes:**
  - `?sellerId=0x24` se interpreta como 36, porque `Number('0x24')` vale 36. El frontend no lo envía: rechaza todo id que no sea solo dígitos.
  - `producto.page.scss` va en 6,2 kB, por encima del aviso de presupuesto de 4 kB y por debajo del error de 8 kB.
