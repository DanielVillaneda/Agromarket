export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'HttpError';
  }
}

export const badRequest = (message: string) => new HttpError(400, message);
export const unauthorized = (message = 'No autenticado.') => new HttpError(401, message);
export const forbidden = (message = 'No tienes permiso para hacer esto.') => new HttpError(403, message);
export const notFound = (message = 'No encontrado.') => new HttpError(404, message);
export const conflict = (message: string) => new HttpError(409, message);
