import { NextFunction, Request, Response } from 'express';

type AsyncRouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/**
 * Envuelve un handler async para que sus errores (incluidos los de
 * Prisma) lleguen al middleware de errores en vez de quedar como una
 * promesa rechazada sin manejar.
 */
export function asyncHandler(handler: AsyncRouteHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next);
  };
}
