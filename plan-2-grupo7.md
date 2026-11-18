# Plan: completar la tabla de endpoints en backend/README.md

## Contexto
A la tabla «## Endpoints» de `backend/README.md` le faltan 11 rutas que ya existen en el backend: recuperación de cuenta, perfil/método de pago y administración. El objetivo es agregarlas con el mismo formato que la tabla actual. Solo se modifica `backend/README.md`; no se toca código.

## Rama
Ya estás en `feat/actualizar-readme-backend`, que apunta a `0b32a04` (el merge del PR #3). Coincide con `master` y con `origin/master`, así que trabajo ahí y no creo otra rama.

## Formato que se mantiene
- Columnas: `| Método | Ruta | Auth | Equivale a (frontend) |`.
- La ruta va entre backticks.
- Auth usa los mismos valores que ya hay (`No`, `Sí`, `Opcional`, `Sí (dueño)`). Para administración uso `Sí (admin)`, siguiendo el patrón de `Sí (dueño)`.
- La última columna nombra el método o la página del frontend que llama al endpoint.

## Filas nuevas

Las de recuperación van justo después de `GET /api/auth/me`, para que todo `/api/auth` quede junto:

| POST | `/api/auth/recuperar` | No | `solicitarRecuperacion()` en `login.page.ts` |
| POST | `/api/auth/recuperar/verificar` | No | `verificarCodigoRecuperacion()` en `login.page.ts` |
| POST | `/api/auth/recuperar/restablecer` | No | `restablecerPassword()` en `login.page.ts` |

Las de perfil y administración van al final, después de `GET /api/recently-viewed`, en el mismo orden en que se montan en `app.ts`:

| GET | `/api/profile/payment-method` | Sí | `getPaymentMethod()` en `perfil.page.ts` |
| PUT | `/api/profile/payment-method` | Sí | `savePaymentMethod()` en `perfil.page.ts` |
| DELETE | `/api/profile/payment-method` | Sí | `deletePaymentMethod()` en `perfil.page.ts` |
| GET | `/api/admin/stats` | Sí (admin) | `getStats()` en `admin.page.ts` |
| GET | `/api/admin/users` | Sí (admin) | `getUsers()` en `admin.page.ts` |
| PATCH | `/api/admin/users/:id/bloqueo` | Sí (admin) | `setUserBlocked()` en `admin.page.ts` |
| GET | `/api/admin/products` | Sí (admin) | `getProducts()` en `admin.page.ts` |
| DELETE | `/api/admin/products/:id` | Sí (admin) | `deleteProduct()` en `admin.page.ts` |

Cada ruta sale de `backend/src/modules/{auth,profile,admin}/*.routes.ts`. Los nombres de métodos salen de `auth.service.ts`, `products.service.ts` (método de pago) y `admin.service.ts`, y comprobé con grep qué página usa cada uno.

## Qué no cambia
- Las 19 filas actuales, el párrafo «Nota: `price` y `quantity`…», la sección «Nota sobre esta entrega» y el resto del README.
- Aviso aparte: `backend/CLAUDE.md` (sección «Notas») dice que la tabla del README está desactualizada. Después de este cambio esa frase deja de ser cierta, pero no la toco porque pediste cambiar solo el README. Si quieres, la quito en otro commit.

## Verificación
1. Ejecutar `git diff --stat`: solo debe aparecer `backend/README.md`, con 11 líneas añadidas y ninguna borrada.
2. Comparar con grep las rutas de los routers con las filas de la tabla: tienen que coincidir los 30 endpoints, los 19 de antes más los 11 nuevos.
3. Comprobar que las filas nuevas tienen 4 columnas y que la tabla se sigue viendo bien en Markdown.
4. Hacer commit solo de `backend/README.md` en `feat/actualizar-readme-backend`. No se hace push.
