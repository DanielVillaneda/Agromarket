# AgroMarket API

<<<<<<< HEAD
Backend en Node.js (Express + Prisma + PostgreSQL) para AgroMarket. Por ahora expone la autenticación (registro/login) que consume el frontend Angular.

## 1. Base de datos

Necesitas una base de datos PostgreSQL accesible. Opciones:

- **Local**: instala PostgreSQL (https://www.postgresql.org/download/) y crea una base de datos, por ejemplo `agromarket`.
- **En la nube (gratis, sin instalar nada)**: crea un proyecto en [Neon](https://neon.tech) o [Supabase](https://supabase.com) y copia la cadena de conexión que te den.

## 2. Configuración
=======
Backend en Node.js (Express + TypeScript) con PostgreSQL (Prisma ORM) para el proyecto AgroMarket. El modelo de datos y los endpoints están diseñados para calzar con lo que ya usa el frontend Ionic/Angular (`ProductsService`, formularios de login/registro, carrito, favoritos, compras).

## 1. Base de datos: PostgreSQL gratis con Neon

No necesitas instalar PostgreSQL en tu PC. Recomendado para este proyecto: **Neon** (https://neon.tech), plan gratuito, sin tarjeta de crédito.

1. Crea una cuenta gratuita en https://neon.tech.
2. Crea un proyecto nuevo (te va a pedir un nombre; puedes usar `agromarket`).
3. En el dashboard del proyecto, copia el **Connection string** (algo como `postgresql://usuario:password@ep-xxxx.us-east-2.aws.neon.tech/agromarket?sslmode=require`).
4. Guárdalo, lo vas a pegar en el `.env` en el paso 3.

Alternativas si prefieres no usar la nube: instalar PostgreSQL localmente, o correrlo con Docker (`docker run --name agromarket-db -e POSTGRES_PASSWORD=agromarket -e POSTGRES_DB=agromarket -p 5432:5432 -d postgres`). En ambos casos, `DATABASE_URL` sería algo como `postgresql://postgres:agromarket@localhost:5432/agromarket`.

## 2. Instalar dependencias
>>>>>>> 216977547b11fe3ac9b700cbdc4f233ae6daebc0

```bash
cd backend
npm install
<<<<<<< HEAD
cp .env.example .env   # ya existe uno con un JWT_SECRET generado; solo ajusta DATABASE_URL
```

Edita `.env` y pon tu `DATABASE_URL` real.

## 3. Crear las tablas

```bash
npm run prisma:migrate -- --name init
```

Esto crea la tabla `users` según `prisma/schema.prisma`.

## 4. Levantar la API
=======
```

## 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` y completa:

- `DATABASE_URL`: la cadena de conexión del paso 1.
- `JWT_SECRET`: cualquier texto largo y aleatorio (por ejemplo, generado con `openssl rand -hex 32`).
- `CORS_ORIGIN`: la URL donde corre el frontend (`http://localhost:8100` si usas `ionic serve`).

## 4. Crear las tablas y cargar datos de prueba

```bash
npx prisma migrate dev --name init
npm run prisma:seed
```

Esto crea las tablas en tu base de datos y las llena con los mismos productos de ejemplo que ya tenía el frontend, más 3 usuarios de prueba (contraseña `agromarket123` para los tres):

- `carlos.perez@agromarket.co`
- `maria.gomez@agromarket.co`
- `demo@agromarket.co` (tiene productos propios, útil para probar la página "Venta")

## 5. Levantar la API
>>>>>>> 216977547b11fe3ac9b700cbdc4f233ae6daebc0

```bash
npm run dev
```

<<<<<<< HEAD
Por defecto queda en `http://localhost:3000`. El frontend (`environment.ts`) ya apunta ahí.

## Endpoints

| Método | Ruta               | Descripción                                  | Body                                             |
|--------|--------------------|-----------------------------------------------|---------------------------------------------------|
| GET    | /api/health         | Verifica que la API está viva                | -                                                   |
| POST   | /api/auth/register  | Crea un usuario y devuelve token + usuario   | `{ nombre, email, telefono, password }`            |
| POST   | /api/auth/login     | Autentica y devuelve token + usuario         | `{ email, password }`                              |
| GET    | /api/auth/me         | Devuelve el usuario del token actual         | Header `Authorization: Bearer <token>`             |
=======
Queda escuchando en `http://localhost:3000`. Prueba que responde con:

```bash
curl http://localhost:3000/api/health
```

## Endpoints

Todas las rutas protegidas esperan el header `Authorization: Bearer <token>` que devuelve login/registro.

| Método | Ruta | Auth | Equivale a (frontend) |
|---|---|---|---|
| POST | `/api/auth/registro` | No | `registroForm` en `login.page.ts` |
| POST | `/api/auth/login` | No | `loginForm` en `login.page.ts` |
| GET | `/api/auth/me` | Sí | mantener sesión iniciada |
| GET | `/api/products?q=texto` | Opcional | `marketProducts` / `searchProducts()` |
| GET | `/api/products/mine` | Sí | `myProducts` (página Venta) |
| GET | `/api/products/:id` | Opcional | `getMarketProduct()` / `getMyProduct()` |
| POST | `/api/products` | Sí | formulario de `vender.page.ts` |
| PUT | `/api/products/:id` | Sí (dueño) | `updateMyProduct()` |
| DELETE | `/api/products/:id` | Sí (dueño) | `removeMyProduct()` |
| GET | `/api/favorites` | Sí | `favoriteProducts` |
| POST | `/api/favorites/:productId` | Sí | `toggleFavorite()` |
| GET | `/api/cart` | Sí | `cartItems` / `cartTotal` / `cartCount` |
| POST | `/api/cart/:productId` | Sí | `addToCart()` |
| PUT | `/api/cart/:productId` | Sí | `updateCartQuantity()` |
| DELETE | `/api/cart/:productId` | Sí | `removeFromCart()` |
| DELETE | `/api/cart` | Sí | `clearCart()` |
| GET | `/api/purchases` | Sí | `purchasedProducts` |
| POST | `/api/purchases/checkout` | Sí | `checkout()` en `carritocompras.page.ts` |
| GET | `/api/recently-viewed` | Sí | `recentlyViewedProducts` |

Nota: `price` y `quantity` viajan como números (no como el string `"$30.000"` que usa hoy el mock del frontend), y los datos del vendedor (`sellerName`, `sellerPhone`, `sellerEmail`) ahora vienen de una tabla `User` real en vez de estar copiados en cada producto. Cuando conectemos el frontend a esta API vamos a necesitar un pequeño adaptador para formatear esos valores y guardar el token JWT (por ejemplo en un nuevo `AuthService` con `localStorage`).

## Comandos útiles

```bash
npm run dev            # levanta la API con recarga automática
npm run build           # compila a JavaScript (dist/)
npm start                # corre la versión compilada
npx prisma studio       # interfaz visual para ver/editar los datos
npx prisma migrate dev  # aplica cambios del schema.prisma a la base de datos
```

## Estructura

```
backend/
  prisma/
    schema.prisma       # modelo de datos (User, Product, Favorite, CartItem, Purchase, ...)
    seed.ts              # datos de ejemplo
  src/
    app.ts               # configuración de Express (cors, json, rutas)
    server.ts             # punto de entrada
    lib/                  # prisma client, jwt, hash de contraseñas, manejo de errores
    middleware/            # requireAuth / attachUserIfPresent, errorHandler
    modules/
      auth/                # registro, login, /me
      products/             # CRUD + búsqueda + serializador
      favorites/
      cart/
      purchases/            # historial + checkout
      recently-viewed/
```

## Nota sobre esta entrega

Este backend se escribió y se instaló (`npm install`) en un entorno de nube de Anthropic que, por política de red de la organización, no puede descargar los binarios de motor de Prisma (`binaries.prisma.sh` está bloqueado ahí). Por eso no se pudo correr `npx prisma generate` / `npx prisma migrate dev` ni levantar la API de punta a punta en ese entorno — es una restricción de esa sandbox, no de tu proyecto ni de tu PC. El resto del código sí se verificó con `tsc --noEmit` (compila sin errores de lógica; los únicos errores que aparecían eran los esperados por no tener el cliente de Prisma generado). En tu máquina, con internet normal, los pasos 2 a 5 de arriba deberían funcionar sin problema.
>>>>>>> 216977547b11fe3ac9b700cbdc4f233ae6daebc0
