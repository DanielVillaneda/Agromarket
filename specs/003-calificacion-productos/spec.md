# Spec 003: Calificación de productos (de 1 a 5 estrellas)

## Qué se construye

Un comprador con sesión iniciada puede calificar un producto de **1 a 5 estrellas** desde el detalle del producto (`/producto/:id`). El detalle muestra el **promedio** de las calificaciones y la **cantidad** de calificaciones que tiene el producto.

Es una versión recortada: solo hay una calificación numérica. No hay comentario de texto ni listado de reseñas individuales.

### Reglas

- Un usuario tiene como máximo **una calificación por producto**. Si vuelve a calificar, se actualiza la que tenía: no se crea otra.
- Un vendedor **no puede calificar su propio producto**.
- La calificación es un número entero entre 1 y 5.

## Por qué

El comprador no tiene hoy ninguna señal de la experiencia de otros compradores con un producto. El promedio y la cantidad de calificaciones le ayudan a decidir la compra.

## Fuera de alcance

- Comentarios de texto, títulos o fotos en la calificación.
- Listar las calificaciones individuales o quién calificó.
- Exigir que el usuario haya comprado el producto para calificarlo.
- Borrar una calificación (solo se crea o se actualiza).
- Mostrar el promedio en la tarjeta del producto, el listado, el buscador o el panel de admin.
- Ordenar o filtrar productos por calificación.

## Criterios de aceptación

**CA1: calificar un producto por primera vez**
- **Given** un comprador con sesión iniciada y un producto de otro vendedor que no tiene calificaciones
- **When** el comprador lo califica con 4 estrellas
- **Then** la API responde 201 con `ratingAverage: 4`, `ratingCount: 1` y `myRating: 4`, y el detalle del producto muestra el promedio 4 con 1 calificación y las 4 estrellas del comprador marcadas.

**CA2: recalificar actualiza en vez de duplicar**
- **Given** un comprador que ya calificó un producto con 4 estrellas
- **When** lo vuelve a calificar con 2 estrellas
- **Then** la API responde 200 con `myRating: 2` y la cantidad de calificaciones no cambia (`ratingCount` sigue en 1 si era la única), y el detalle muestra el promedio actualizado.

**CA3: el promedio se recalcula bien**
- **Given** un producto que dos compradores distintos calificaron con 5 y 4 estrellas
- **When** un tercer comprador lo califica con 3 estrellas
- **Then** la API responde con `ratingAverage: 4` y `ratingCount: 3`. Y si después el primero cambia su 5 por un 2, el promedio pasa a 3 (`(2 + 4 + 3) / 3`) y la cantidad sigue en 3.

**CA4: un vendedor no puede calificar su propio producto**
- **Given** un vendedor con sesión iniciada en el detalle de su propio producto
- **When** intenta calificarlo (desde la API)
- **Then** la API responde 403 con el mensaje "No puedes calificar tu propio producto." y no se guarda nada. En el detalle de su propio producto no aparece el selector de estrellas.

## Ajustes durante la implementación

- **Archivos fuera de la lista inicial.** También cambiaron `backend/src/app.ts` (montar `/api/reviews`), `backend/README.md` (las dos filas de la tabla de endpoints), `src/app/icons.ts` (íconos `star` y `star-outline`) y `src/app/services/products.service.ts` (tipos, `getRatingSummary` y `rateProduct`). Se agregó `backend/src/modules/reviews/reviews.summary.ts` para que el serializer y el módulo redondeen el promedio igual.
- **Validación de `rating` más estricta que en el plan.** El plan usaba `z.coerce.number()`. agente-pruebas encontró que así se aceptaban `true` (se guardaba como 1) y `[5]` (como 5), y agente-api-backend lo cambió a `z.number()` sin coerce. Ahora solo se acepta un número entero de 1 a 5; `"4"` (texto) también da 400. El frontend siempre envía un número.
- **Una petición menos en el detalle.** `GET /api/reviews/:id` solo se llama con sesión y si el usuario no es el vendedor, porque es lo único que trae `myRating`. El promedio y la cantidad ya vienen en el producto.
- **Accesibilidad.** agente-accesibilidad:
  - agregó el texto "Tu calificación: N de 5";
  - subió las estrellas a 44 px con foco visible;
  - oscureció el color de la estrella llena para cumplir 3:1;
  - cambió `disabled` por `aria-disabled` mientras se envía, para que el foco de teclado no se pierda.

  No quedó nada bloqueante.
- **No se corrió agente-e2e completo.** La spec no toca login, recuperación de cuenta, carrito, checkout, pagos ni admin (ver `CLAUDE.md`). CA1 a CA4 quedaron cubiertos con curl contra la API local y con specs de frontend (ver `tasks.md`, T5).
- **Pendientes no bloqueantes:**
  - Las estrellas usan `aria-pressed`. Un `radiogroup` con `aria-checked` sería más preciso para un lector de pantalla; el texto "Tu calificación" lo compensa.
  - El resumen actualizado no se anuncia por sí mismo; sí se anuncia el mensaje "¡Gracias por tu calificación!".
  - El enlace "Inicia sesión para calificar" tiene un área táctil pequeña.
  - Si el producto no existe y además el cuerpo es inválido, el POST responde 400 en vez de 404, porque valida el cuerpo antes de buscar el producto.
  - `producto.page.scss` pasa el aviso de presupuesto de 4 kB (sigue por debajo del error de 8 kB).
