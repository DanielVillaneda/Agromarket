# Tareas 004: Filtro por precio en la búsqueda

Spec: [spec.md](spec.md) · Plan: [plan.md](plan.md)

## T1. Frontend (agente-ui-frontend)

- [x] T1.1 Exportar `RangoPrecio` y agregar el parámetro opcional `rango` a `searchProducts` en `products.service.ts` (límites inclusivos sobre `rawPrice`; `null` = sin límite; sin rango, mismo comportamiento que antes).
- [x] T1.2 En `search.page.ts`: signals `precioMinimo` y `precioMaximo`, `computed` `rangoInvalido` y `results` con el rango solo si es válido. Agregar la acción "Quitar filtro de precio".
- [x] T1.3 En `search.page.html` (y `.scss`): el `fieldset` "Filtrar por precio" con los dos campos, el mensaje de rango inválido y el mensaje cuando ningún resultado cae en el rango.

## T2. Accesibilidad (agente-accesibilidad)

- [x] T2.1 Revisar los campos de precio (label asociado, `aria-invalid`, `aria-describedby`) y que el mensaje de rango inválido se anuncie al lector de pantalla.

## T3. Pruebas (agente-pruebas)

- [x] T3.1 `.spec.ts` para `searchProducts` con rango (sin rango, solo mínimo, solo máximo, los dos e inclusivos).
- [x] T3.2 `.spec.ts` para `/search` (CA1 a CA4 en el DOM, incluido el mensaje de rango inválido y que el filtro no se aplica).
- [x] T3.3 Correr cada spec por separado y comparar contra la línea base tomada antes del cambio: sin regresiones.

## T4. Cierre (orquestador)

- [x] T4.1 Anotar en `spec.md` los ajustes respecto al plan y la decisión de no correr agente-e2e completo.
