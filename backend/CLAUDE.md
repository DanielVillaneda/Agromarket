# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

API REST de AgroMarket: Express 4 + TypeScript (CommonJS, `strict`) + Prisma 6 + PostgreSQL. Este archivo complementa el `CLAUDE.md` de la raíz, que cubre el frontend y el despliegue (Vercel hace de proxy de `/api` hacia este backend en Render). El código, los comentarios y todos los mensajes de error están en español. Los mensajes de error llegan tal cual a la UI, así que deben ser frases claras y orientadas al usuario.

## Comandos

Hay que ejecutarlos desde `backend/`. Requieren Node >= 20 y un `.env` copiado de `.env.example`.

```bash
npm run dev                          # tsx watch src/server.ts → http://localhost:3000 (GET /api/health)
npm run build                        # tsc → dist/
npm start                            # node dist/server.js
npx tsc --noEmit                     # chequeo de tipos (no hay tests ni linter en el backend)
npx prisma migrate dev --name <nombre>   # tras editar prisma/schema.prisma; regenera el cliente
npx prisma generate                  # si los tipos de @prisma/client quedan desfasados
npm run prisma:seed                  # datos de ejemplo (upsert, se puede repetir)
npx prisma studio
```

Usuarios del seed (contraseña `agromarket123` para todos): `carlos.perez@`, `maria.gomez@`, `demo@` (tiene productos propios) y `admin@agromarket.co` (rol admin).

Variables obligatorias: `DATABASE_URL` y `JWT_SECRET`. `lib/env.ts` lanza un error al arrancar si falta alguna. Las opcionales son `PORT`, `JWT_EXPIRES_IN` (por defecto `7d`), `CORS_ORIGIN` (lista separada por comas; además siempre se acepta cualquier origen localhost) y `SMTP_*`/`MAIL_FROM`. Si `SMTP_USER`/`SMTP_PASS` están vacíos, el código de recuperación se imprime en la consola en vez de enviarse por correo.

## Estructura

- `src/server.ts` solo arranca el servidor. `src/app.ts` (`createApp`) configura CORS, `express.json({ limit: '15mb' })` (las fotos viajan como data URLs base64), monta un router por módulo bajo `/api/<módulo>` y al final registra `notFoundHandler` y `errorHandler`.
- `src/modules/<módulo>/` contiene `<módulo>.routes.ts`, que exporta `<módulo>Router`, y opcionalmente `<módulo>.schemas.ts` (Zod). Los módulos son `auth`, `products`, `favorites`, `cart`, `purchases`, `recently-viewed`, `profile` y `admin`. Un módulo nuevo se registra en `app.ts`.
- `src/lib/` tiene utilidades compartidas:
  - `prisma` es un cliente único que se reutiliza en `global` durante el desarrollo.
  - `jwt` firma tokens con el payload `{ userId }`.
  - `password` usa bcryptjs con 10 rondas.
  - `httpError` y `asyncHandler` sirven para el manejo de errores.
  - `params.parseId` convierte los ids de la ruta.
  - `units` hace las conversiones de unidad.
  - `mailer` envía correos con nodemailer.
- `prisma/schema.prisma`: los modelos se escriben en PascalCase y las tablas en snake_case plural (`@@map`). Casi todas las relaciones usan `onDelete: Cascade`.

## Convenciones de las rutas

Cada handler sigue el mismo patrón, y conviene respetarlo:

```ts
router.post('/:id', requireAuth, asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);          // 400 si no es un entero positivo
  const data = algoSchema.parse(req.body);    // un ZodError se convierte en 400 con { message, errors[] }
  const existing = await prisma.x.findUnique({ where: { id } });
  if (!existing) throw notFound('…');         // helpers de lib/httpError
  if (existing.sellerId !== req.userId) throw forbidden('…');
  res.status(201).json(...);
}));
```

- Todos los handlers async van envueltos en `asyncHandler`. Si no, un error se convierte en una promesa rechazada que nadie atiende.
- Los errores se lanzan con `badRequest`, `unauthorized`, `forbidden`, `notFound` y `conflict`, en lugar de escribir `res.status(...)` a mano. `errorHandler` responde siempre con `{ message }`. También convierte el error P2002 de Prisma (valor único duplicado) en un 409, y cualquier otro error en un 500 genérico sin detalles.
- Al eliminar se responde con `204` y `send()`, y al crear con `201`.
- Los productos siempre se consultan con `include: productInclude` y se devuelven con `serializeProduct` (`products/product.serializer.ts`). Esa función aplana al vendedor en `sellerName`, `sellerPhone` y `sellerEmail`, y las fotos en `photos: string[]`. El frontend (`ProductsService.mapProduct`) depende de esa forma, así que cualquier cambio tiene que hacerse en ambos lados.
- Los usuarios se exponen con una función `publicUser(...)` local en cada módulo. Nunca se devuelven `passwordHash` ni `passwordResetCode`.
- Los routers que son totalmente privados declaran `router.use(requireAuth)` al principio. `admin` usa `router.use(requireAuth, requireAdmin)`.

## Autenticación (`middleware/auth.ts`)

- `requireAuth` verifica el JWT y además consulta el usuario en la base de datos en cada request. Rechaza con 401 a los usuarios que no existen y con 403 a los bloqueados (`isBlocked`). Deja disponibles `req.userId` y `req.userRole`.
- `attachUserIfPresent` sirve para las rutas públicas. Solo decodifica el token, sin consultar la base de datos ni revisar `isBlocked`, y si el token es inválido sigue la petición como anónima. Así es como `GET /api/products` excluye los productos propios (salvo con `?includeMine=true`) y como `GET /api/products/:id` registra el producto en "vistos recientemente".
- `requireAdmin` compara `req.userRole === 'admin'`, así que tiene que ir después de `requireAuth`. `role` es un `String` (`user` | `admin`) y no un enum, y ningún endpoint público otorga el rol admin.
- La recuperación de cuenta (`/api/auth/recuperar`, `/recuperar/verificar` y `/recuperar/restablecer`) funciona con un código de 6 dígitos que se guarda en `User` y vence a los 15 minutos. `/recuperar` responde lo mismo exista o no el correo. `/restablecer` vuelve a validar el código.

## Dominio: unidades, stock y precios

- `Product.price` es un `Int` en pesos colombianos (COP) sin decimales, y corresponde al precio por `product.unit`.
- `Product.quantity` es un `Float`: el stock puede quedar fraccionado. En cambio, `CartItem.quantity` y `Purchase.quantity` son `Int` y se expresan en la unidad que eligió el comprador (`item.unit`), que puede ser distinta de la del producto.
- Unidades: `kilo`, `tonelada`, `libra`, `litro` y `unidad`. Solo las de peso se convierten entre sí (`lib/units.ts`: `canConvert`, `convertWeight`, `convertPrice`). El frontend tiene una copia de esta lógica en `src/app/services/products.service.ts`, y hay que mantener las dos iguales.
- Las comparaciones de stock usan una tolerancia de `1e-9`, y los descuentos de stock se redondean a 6 decimales.
- `GET /api/cart` corrige el carrito en la base de datos al leerlo. Si el vendedor bajó el stock, recorta la cantidad. Si las unidades ya no se pueden convertir, elimina el ítem.
- `POST /api/purchases/checkout` primero revalida el stock y después abre un `$transaction` donde:
  1. Borra los ítems del carrito y falla con 409 si se borraron menos de los esperados, lo que indica que hubo otro checkout al mismo tiempo.
  2. Descuenta el stock con un `updateMany` condicional (`quantity >= descuento` y la misma unidad).
  3. Crea cada `Purchase` con el `unitPrice` convertido a la unidad del comprador y una copia del método de pago.

  Si se modifica el checkout, hay que mantener estas protecciones contra condiciones de carrera.
- El método de pago (`profile`) es simulado: solo guarda `bankName`, `holderName` y `last4`. No hay cobros reales.
- Fotos: crear un producto exige al menos una foto. Al editar, si se envía `photos` se reemplazan todas (`deleteMany` + `create`).

## Notas

- La tabla de endpoints de `README.md` está desactualizada. No incluye `/api/auth/recuperar*`, `/api/profile/*` ni `/api/admin/*`. La sección "Nota sobre esta entrega" describe un sandbox antiguo y no aplica.
- Los correos no se normalizan a minúsculas al registrarse ni al iniciar sesión: la búsqueda por `email` distingue mayúsculas de minúsculas.
