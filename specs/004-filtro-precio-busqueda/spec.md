# Spec 004: Filtro por precio en la búsqueda

## Qué se construye

En la página de resultados de búsqueda (`/search?q=...`), además del texto, el comprador puede escribir un **precio mínimo** y/o un **precio máximo** para filtrar los resultados. Los dos campos son opcionales: un campo vacío significa "sin límite" por ese lado. Los límites son inclusivos.

El precio que se compara es el precio publicado del producto, en pesos colombianos, por la unidad en la que lo publicó el vendedor (el mismo que muestra la tarjeta).

Es un cambio solo de frontend: no hay cambios de backend ni de base de datos.

## Por qué

Hoy la búsqueda solo filtra por nombre. Un comprador con un presupuesto tiene que revisar uno por uno los resultados para descartar los que no puede pagar. Con un rango de precio ve directamente lo que está dentro de su presupuesto.

## Fuera de alcance

- Guardar el rango en la URL o recordarlo entre búsquedas.
- Filtrar por precio en el inicio, en "Venta" o en otras páginas.
- Convertir precios entre unidades para compararlos (por ejemplo, precio por kilo contra precio por libra).
- Ordenar los resultados por precio.
- Filtrar por precio sin un texto de búsqueda.

## Criterios de aceptación

**CA1: buscar sin filtro de precio muestra todos los resultados del texto**
- **Given** productos cuyo nombre contiene "café", con precios de 8.000, 15.000 y 30.000
- **When** el comprador busca "café" y deja vacíos el precio mínimo y el máximo
- **Then** se muestran los tres productos.

**CA2: con un mínimo solo quedan los productos con precio igual o mayor**
- **Given** la misma búsqueda "café"
- **When** el comprador escribe 15.000 como precio mínimo
- **Then** se muestran solo los productos de 15.000 y 30.000; el de 8.000 no aparece.

**CA3: con un máximo solo quedan los productos con precio igual o menor**
- **Given** la misma búsqueda "café"
- **When** el comprador escribe 15.000 como precio máximo
- **Then** se muestran solo los productos de 8.000 y 15.000; el de 30.000 no aparece. Y si además escribe 10.000 como mínimo, solo queda el de 15.000.

**CA4: si el mínimo es mayor que el máximo, se avisa y no se aplica el filtro**
- **Given** la misma búsqueda "café"
- **When** el comprador escribe 20.000 como precio mínimo y 10.000 como máximo
- **Then** se muestra el mensaje "El precio mínimo no puede ser mayor que el máximo." (anunciado al lector de pantalla), el filtro de precio no se aplica y se siguen viendo los tres productos.

## Ajustes durante la implementación

- **Labels con "(COP)".** Los campos quedaron como "Precio mínimo (COP)" y "Precio máximo (COP)", con los placeholders "Sin mínimo" y "Sin máximo", para dejar claro que el precio va en pesos.
- **Foco al quitar el filtro (cambio en TS que no estaba en el plan).** agente-accesibilidad encontró un bloqueante (WCAG 2.4.3): al pulsar "Quitar filtro de precio", el botón salía del DOM y el foco caía al inicio de la página. Se devolvió a agente-ui-frontend, que ahora mueve el foco a "Precio mínimo" antes de limpiar el rango.
- **Accesibilidad.** agente-accesibilidad:
  - agregó una región `aria-live="polite"` que anuncia el conteo al filtrar ("3 resultados", "Sin resultados");
  - subió el contraste del borde de los campos y del placeholder;
  - puso los campos y el botón a 44 px de alto, y a 16 px la letra de los campos.

  El mensaje de rango inválido se queda en `role="alert"`. No quedó nada bloqueante.
- **Un producto sin precio numérico** queda fuera del resultado cuando hay algún límite activo. Sin límites se muestra como antes.
- **No se corrió agente-e2e completo.** La spec no toca flujos críticos (ver `CLAUDE.md`). Tampoco hizo falta `tsc` de backend, porque no se tocó `backend/`. CA1 a CA4 quedaron cubiertos con specs de frontend (ver `tasks.md`, T3).
- **Pendientes no bloqueantes y decisiones abiertas:**
  - Si el comprador busca otro texto estando ya en `/search`, el rango de precio se conserva, porque no se limpia al cambiar `q`. La spec no lo define; falta decidir si se debe limpiar.
  - "(COP)" podría leerse letra por letra en algunos lectores de pantalla. Una alternativa es "(pesos colombianos)".
  - Los mensajes usan comillas rectas ("x") en vez de tipográficas.
  - El conteo en vivo se anuncia con cada tecla mientras cambia el resultado; se podría suavizar con un debounce.
