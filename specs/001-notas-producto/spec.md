# Spec 001: Notas del vendedor en el producto

## Qué se construye

Un campo opcional **"notas"** en el producto. El vendedor puede escribirlo al publicar un producto (`/vender`) o al editarlo (`/producto-vender/:id`). El comprador lo ve en el detalle del producto (`/producto/:id`), en una sección propia, solo cuando el producto tiene notas.

## Por qué

Los vendedores necesitan aclarar detalles que no caben en la descripción del producto, por ejemplo "disponible solo los fines de semana" o "se entrega en la plaza de mercado de Neiva". Hoy la única opción es mezclarlos en la descripción, que es obligatoria y describe el producto en sí.

## Fuera de alcance

- Mostrar las notas en la tarjeta del producto (`product-card`), en el listado o en el buscador.
- Que el comprador escriba notas (por ejemplo, al comprar).
- Formato enriquecido: las notas son texto plano.

## Criterios de aceptación

**CA1: crear un producto con notas y verlas en el detalle**
- **Given** un vendedor con sesión iniciada
- **When** publica un producto con las notas "Disponible solo los fines de semana"
- **Then** la API responde 201 con `notas: "Disponible solo los fines de semana"`, y el detalle del producto muestra la sección "Notas del vendedor" con ese texto.

**CA2: crear un producto sin notas y que no aparezca la sección**
- **Given** un vendedor con sesión iniciada
- **When** publica un producto dejando las notas vacías
- **Then** la API responde 201 con `notas: null`, y el detalle del producto no muestra la sección "Notas del vendedor".

**CA3: editar un producto para agregarle notas**
- **Given** un producto existente sin notas, cuyo dueño tiene sesión iniciada
- **When** el dueño lo edita, escribe "Disponible solo los fines de semana" en las notas y guarda
- **Then** la API responde 200 con esas notas, y el detalle del producto muestra la sección "Notas del vendedor" con ese texto.

**CA4: editar un producto para quitarle las notas**
- **Given** un producto con notas, cuyo dueño tiene sesión iniciada
- **When** el dueño vacía el campo de notas y guarda
- **Then** la API responde 200 con `notas: null`, y el detalle del producto deja de mostrar la sección "Notas del vendedor".

## Ajustes durante la implementación

- **`products.routes.ts` también cambió.** No estaba en la lista inicial de archivos de la solicitud, pero el create y el update copian los campos uno por uno al `data` de Prisma. Sin pasar `notas` ahí, el campo se validaba con Zod pero no se guardaba.
- **No se corrió agente-e2e completo.** Es una spec de bajo riesgo: agrega un campo opcional y no toca flujos críticos (login, recuperación de cuenta, carrito, compra). Los criterios CA1 a CA4 quedaron cubiertos con curl contra la API local y con specs de frontend (ver `tasks.md`, T5). Esta decisión de política se documentará por separado en `CLAUDE.md`.
