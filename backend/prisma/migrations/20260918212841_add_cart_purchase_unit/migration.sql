-- AlterTable: agrega "unit" con un default temporal, la rellena desde el
-- producto relacionado (para que las filas existentes queden coherentes) y
-- luego deja el default definitivo para las filas nuevas.
ALTER TABLE "cart_items" ADD COLUMN "unit" TEXT NOT NULL DEFAULT 'unidad';
UPDATE "cart_items" ci
SET "unit" = p."unit"
FROM "products" p
WHERE p."id" = ci."productId";

ALTER TABLE "purchases" ADD COLUMN "unit" TEXT NOT NULL DEFAULT 'unidad';
UPDATE "purchases" pu
SET "unit" = p."unit"
FROM "products" p
WHERE p."id" = pu."productId";
