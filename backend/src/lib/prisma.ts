import { PrismaClient } from '@prisma/client';

/**
 * Cliente único de Prisma para toda la app. En desarrollo, con tsx watch
 * recargando el proceso, conviene reutilizar la instancia colgada del
 * objeto global para no abrir una conexión nueva a PostgreSQL en cada
 * recarga en caliente.
 */
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma = global.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}
