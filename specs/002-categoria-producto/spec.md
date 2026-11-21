# Spec 002: Categoría del producto y filtro en el inicio

## Qué se construye

Un campo opcional **"categoría"** en el producto, con cinco valores fijos: **Frutas**, **Verduras**, **Granos**, **Lácteos** y **Otros**. El vendedor la elige al publicar un producto (`/vender`). La tarjeta del producto (`product-card`) muestra la categoría cuando la tiene.

En la página de inicio (`/home`), la sección "Lo más reciente" tiene un filtro por categoría: la opción **"Todas"** (seleccionada por defecto) y una opción por cada categoría. Al elegir una categoría solo se ven los productos de esa categoría.

## Por qué

Hoy el inicio muestra todos los productos mezclados y la única forma de encontrar algo es el buscador por nombre. Agrupar por categoría le permite al comprador encontrar más rápido lo que busca, por ejemplo ver solo las frutas disponibles.

## Fuera de alcance

- Cambiar la categoría al editar un producto (`/producto-vender/:id`). Un PUT que no trae `categoria` la deja como está.
- Filtrar por categoría en el buscador (`/search`), en "Venta" o en el panel de admin.
- Categorías administrables o creadas por el usuario: la lista es fija.
- Asignar categorías a los productos existentes o a los del seed: quedan sin categoría.

## Criterios de aceptación

**CA1: crear un producto con categoría y verla en su tarjeta**
- **Given** un vendedor con sesión iniciada
- **When** publica un producto con la categoría "Frutas"
- **Then** la API responde 201 con `categoria: "Frutas"`, y la tarjeta de ese producto muestra la categoría "Frutas".

**CA2: filtrar el inicio por una categoría**
- **Given** el inicio con productos de categoría "Frutas", productos de otras categorías y productos sin categoría
- **When** el comprador elige el filtro "Frutas"
- **Then** "Lo más reciente" muestra solo los productos de categoría "Frutas".

**CA3: "Todas" quita el filtro**
- **Given** el inicio filtrado por "Frutas"
- **When** el comprador elige "Todas"
- **Then** "Lo más reciente" vuelve a mostrar todos los productos, con y sin categoría.

**CA4: un producto sin categoría solo aparece en "Todas"**
- **Given** un producto publicado sin categoría (la API responde 201 con `categoria: null`)
- **When** el comprador recorre los filtros del inicio
- **Then** el producto no aparece en ninguna de las cinco categorías, sí aparece en "Todas", y su tarjeta no muestra categoría.

## Ajustes durante la implementación

- **`products.routes.ts` también cambió.** No estaba en la lista inicial de archivos de la solicitud, pero el create y el update copian los campos uno por uno al `data` de Prisma. Sin pasar `categoria` ahí, el campo se validaba pero no se guardaba (igual que en la spec 001).
- **Validación de `categoria` en el backend.** No quedó como `z.enum` directo: es `z.string().trim()` con `""` → `null` y un `refine` contra `productCategories`, para aceptar `""` y `null` y responder "Elige una categoría válida." con cualquier otro valor. El resultado es el del plan.
- **Accesibilidad.** agente-accesibilidad agregó al inicio una región `aria-live="polite"` que anuncia el conteo al cambiar de filtro (por ejemplo, "1 producto en Verduras"), corrigió el recorte del foco de los chips y les dio 44 px de alto en celular. No quedó nada bloqueante.
- **`vender.page.spec.ts`.** Se agregó `categoria: ''` a su `form.setValue`, porque el control nuevo lo exige (NG01002). No es una regresión de producción.
- **No se corrió agente-e2e completo.** La spec es de riesgo medio-bajo: agrega un campo opcional y un filtro en el cliente, y no toca login, recuperación de cuenta, carrito, checkout, pagos ni admin (ver `CLAUDE.md`). CA1 a CA4 quedaron cubiertos con curl contra la API local y con specs de frontend (ver `tasks.md`, T5).
- **Pendientes no bloqueantes:**
  - Una categoría con la tilde en NFD ("a" + U+0301) responde 400. El frontend siempre envía NFC; se arreglaría con `.normalize('NFC')` en el schema.
  - Un valor que no es texto (por ejemplo, `123`) responde con el mensaje de Zod en inglés.
  - En la tarjeta, los botones de favorito y carrito van dentro del `<a>` del inicio, lo cual es HTML inválido. Ya era así antes de esta spec.
