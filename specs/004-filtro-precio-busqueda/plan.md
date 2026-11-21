# Plan 004: Filtro por precio en la búsqueda

Spec: [spec.md](spec.md)

## Decisiones técnicas

- **Solo cliente, sin backend.** `ProductsService.searchProducts(query)` ya filtra en el cliente sobre los productos cargados (`_searchableProducts`), así que el filtro de precio se aplica en el mismo lugar. No cambia ningún endpoint ni la base de datos.
- **Precio que se compara:** `Product.rawPrice`, el número en COP que llega de la API en `price` antes de formatearse. No se convierte entre unidades.
- **Servicio:**
  - Se exporta `interface RangoPrecio { minimo: number | null; maximo: number | null }`.
  - `searchProducts(query: string, rango?: RangoPrecio): Product[]` recibe el rango como segundo parámetro opcional. Primero filtra por texto, como hoy. Después aplica `rawPrice >= minimo` si hay mínimo y `rawPrice <= maximo` si hay máximo.
  - Los límites son inclusivos y `null` significa sin límite. Sin rango, el comportamiento es idéntico al actual, así que los demás usos no cambian.
  - El servicio no valida el rango: esa decisión es de la página.
- **Página `/search`:**
  - Signals `precioMinimo` y `precioMaximo` (`number | null`). Un campo vacío o no numérico es `null`.
  - `rangoInvalido` es un `computed`: verdadero si los dos tienen valor y el mínimo es mayor que el máximo.
  - `results` llama a `searchProducts(query, rangoInvalido ? undefined : { minimo, maximo })`. Con el rango inválido se muestran todos los resultados del texto (CA4).
  - El filtro se aplica al escribir, sin botón "Aplicar". Hay un botón "Quitar filtro de precio" que vacía los dos campos y solo se ve si alguno tiene valor.
- **Markup:**
  - Un `<fieldset>` con `<legend>` "Filtrar por precio", que solo se muestra cuando hay texto de búsqueda.
  - Dos `<input type="number" inputmode="numeric" min="0" step="1">`, cada uno con su `<label for>` ("Precio mínimo" y "Precio máximo").
  - El mensaje de rango inválido, "El precio mínimo no puede ser mayor que el máximo.", va en un contenedor con `role="alert"`, que siempre está en el DOM. Los inputs llevan `aria-invalid` y `aria-describedby` hacia el mensaje mientras el rango es inválido.
  - Si el texto tiene resultados pero ninguno cae en el rango, se muestra "No hay productos para "x" en ese rango de precio.".
- **Pruebas:** `search.page.spec.ts` solo prueba que la página se crea; se agregan specs nuevos (ver `tasks.md`).

## Archivos que se van a tocar

| Capa | Archivo | Cambio |
|---|---|---|
| Frontend | `src/app/services/products.service.ts` | `RangoPrecio` y el parámetro opcional `rango` en `searchProducts` |
| Frontend | `src/app/pages/search/search.page.ts` | Signals del rango, `rangoInvalido`, `results` con el rango y "Quitar filtro de precio" |
| Frontend | `src/app/pages/search/search.page.html` | Campos de precio, mensaje de rango inválido y mensaje vacío por rango |
| Frontend | `src/app/pages/search/search.page.scss` | Estilos de los campos (si hace falta) |
| Pruebas | `*.spec.ts` en `src/app/**` | Ver `tasks.md` |

No cambian `backend/`, `schema.prisma` ni ningún endpoint.

## Orden de delegación (según `CLAUDE.md`)

En secuencia estricta, un agente a la vez:

1. `agente-ui-frontend`: servicio y página `/search`.
2. `agente-accesibilidad`: label asociado a cada campo de precio, y que el mensaje de rango inválido se anuncie al lector de pantalla.
3. `agente-pruebas`: pruebas desde los criterios de aceptación.

No se usan `agente-schema-db` ni `agente-api-backend`, porque no hay cambios de datos ni de API. `agente-e2e` no se corre completo: la spec no toca flujos críticos (ver `CLAUDE.md`). Tampoco hace falta `tsc` de backend.
