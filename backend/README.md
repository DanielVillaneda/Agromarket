# AgroMarket API

Backend en Node.js (Express + Prisma + PostgreSQL) para AgroMarket. Por ahora expone la autenticación (registro/login) que consume el frontend Angular.

## 1. Base de datos

Necesitas una base de datos PostgreSQL accesible. Opciones:

- **Local**: instala PostgreSQL (https://www.postgresql.org/download/) y crea una base de datos, por ejemplo `agromarket`.
- **En la nube (gratis, sin instalar nada)**: crea un proyecto en [Neon](https://neon.tech) o [Supabase](https://supabase.com) y copia la cadena de conexión que te den.

## 2. Configuración

```bash
cd backend
npm install
cp .env.example .env   # ya existe uno con un JWT_SECRET generado; solo ajusta DATABASE_URL
```

Edita `.env` y pon tu `DATABASE_URL` real.

## 3. Crear las tablas

```bash
npm run prisma:migrate -- --name init
```

Esto crea la tabla `users` según `prisma/schema.prisma`.

## 4. Levantar la API

```bash
npm run dev
```

Por defecto queda en `http://localhost:3000`. El frontend (`environment.ts`) ya apunta ahí.

## Endpoints

| Método | Ruta               | Descripción                                  | Body                                             |
|--------|--------------------|-----------------------------------------------|---------------------------------------------------|
| GET    | /api/health         | Verifica que la API está viva                | -                                                   |
| POST   | /api/auth/register  | Crea un usuario y devuelve token + usuario   | `{ nombre, email, telefono, password }`            |
| POST   | /api/auth/login     | Autentica y devuelve token + usuario         | `{ email, password }`                              |
| GET    | /api/auth/me         | Devuelve el usuario del token actual         | Header `Authorization: Bearer <token>`             |
