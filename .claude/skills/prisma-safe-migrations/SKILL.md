---
name: prisma-safe-migrations
description: Usar cuando se vaya a cambiar el modelo de datos (schema.prisma) o se necesite una migración en el backend de AgroMarket. Explica el flujo seguro para no dañar las migraciones ya aplicadas.
---

# Migraciones seguras de Prisma en AgroMarket

- Nunca edites a mano un archivo dentro de `backend/prisma/migrations/` que ya fue aplicado.
- Para cambiar el modelo de datos: edita `backend/prisma/schema.prisma` y corre: npx prisma migrate dev --name <descripcion-corta> dentro de la carpeta `backend/`. Esto genera una migración nueva automáticamente.
- Después de cualquier cambio de schema, corre `npx tsc --noEmit` dentro de `backend/` para confirmar que el código siga compilando con los tipos nuevos de Prisma.