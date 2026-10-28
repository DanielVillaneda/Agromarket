import { z } from 'zod';

export const registroSchema = z.object({
  nombre: z.string().trim().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  email: z.string().trim().email('Correo electrónico inválido.'),
  telefono: z
    .string()
    .trim()
    .regex(/^[0-9]{7,10}$/, 'El teléfono debe tener entre 7 y 10 dígitos.'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Correo electrónico inválido.'),
  password: z.string().min(1, 'Ingresa tu contraseña.'),
});

export const solicitarRecuperacionSchema = z.object({
  email: z.string().trim().email('Correo electrónico inválido.'),
});

export const verificarCodigoSchema = z.object({
  email: z.string().trim().email('Correo electrónico inválido.'),
  code: z.string().trim().regex(/^[0-9]{6}$/, 'El código debe tener 6 dígitos.'),
});

export const restablecerPasswordSchema = z.object({
  email: z.string().trim().email('Correo electrónico inválido.'),
  code: z.string().trim().regex(/^[0-9]{6}$/, 'El código debe tener 6 dígitos.'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
});

export type RegistroInput = z.infer<typeof registroSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
