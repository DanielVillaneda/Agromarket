# Plan: correos en minúsculas en registro, login y recuperación

## Contexto
Hoy `backend/src/modules/auth` busca usuarios con `prisma.user.findUnique({ where: { email } })`. Esa búsqueda distingue mayúsculas de minúsculas, y además los schemas de Zod solo aplican `trim()` al correo. Por eso `Demo@agromarket.co` y `demo@agromarket.co` pueden registrarse como dos cuentas distintas, y quien escribe su correo con otras mayúsculas no puede entrar.

Objetivo: que los correos nuevos se guarden en minúsculas y que todas las búsquedas de los endpoints de auth ignoren mayúsculas y minúsculas. No se toca `schema.prisma`, no hay migración y no se modifican los correos ya guardados.

Para cumplir lo de no tocar los correos guardados, no alcanza con pasar la entrada a minúsculas y seguir usando `findUnique`. Un usuario guardado como `Demo@agromarket.co` ya no podría iniciar sesión, y alguien podría registrar `demo@agromarket.co` como cuenta nueva. Por eso la búsqueda también tiene que ignorar mayúsculas en la base de datos.

## Cambios (todos en `backend/src/modules/auth/`)

### 1. `auth.schemas.ts`: normalizar la entrada
- Crear un único `emailSchema = z.string().trim().toLowerCase().email('Correo electrónico inválido.')`. Zod 3.25.76 trae `.toLowerCase()`.
- Usar `emailSchema` en los 5 schemas: `registroSchema`, `loginSchema`, `solicitarRecuperacionSchema`, `verificarCodigoSchema` y `restablecerPasswordSchema`.
- Así, después del `parse`, `data.email` siempre llega en minúsculas. En el registro eso es lo que se guarda, porque el `prisma.user.create` ya usa `data.email`.

### 2. `auth.routes.ts`: búsqueda que ignora mayúsculas
Agregar una función local `findUserByEmail(email)`:

```ts
// Busca ignorando mayúsculas: los usuarios antiguos pueden tener el correo
// guardado con mayúsculas y no se migran. Si por datos viejos hubiera dos
// cuentas que solo difieren en mayúsculas, se toma la más antigua para que
// el resultado sea siempre el mismo.
async function findUserByEmail(email: string) {
  const rows = await prisma.$queryRaw<{ id: number }[]>`
    SELECT id FROM users WHERE LOWER(email) = ${email} ORDER BY id LIMIT 1`;
  return rows.length ? prisma.user.findUnique({ where: { id: rows[0].id } }) : null;
}
```
- Uso `LOWER(email) = $1` con `$queryRaw` y no `mode: 'insensitive'` de Prisma. En PostgreSQL, Prisma resuelve `mode: 'insensitive'` con `ILIKE`, y ahí `_` y `%` funcionan como comodines. `_` es común en los correos (`juan_perez@…`), así que `juan_perez` podría coincidir con `juanXperez`. La plantilla etiquetada parametriza el valor, así que no hay riesgo de inyección SQL. La tabla real se llama `users` por el `@@map`.
- Reemplazar las 5 llamadas `prisma.user.findUnique({ where: { email } })` por `findUserByEmail(email)`: registro (comprobar si ya existe), login, `/recuperar`, `/recuperar/verificar` y `/recuperar/restablecer`.
- `/recuperar` debe seguir enviando el código a `user.email`, es decir, al correo tal como está guardado. Esa línea no cambia.
- Las actualizaciones posteriores ya usan `where: { id: user.id }`, así que no hay que tocarlas.

### Qué no cambia
- `schema.prisma`, las migraciones y los datos existentes.
- `seed.ts`, que ya usa correos en minúsculas.
- `admin.routes.ts` y `product.serializer.ts`: solo muestran el correo, no lo buscan.
- El frontend: el backend normaliza lo que recibe, así que no hace falta cambiar nada ahí.
- Tampoco cambia el índice único de `email`. Sigue distinguiendo mayúsculas, pero como todo correo nuevo entra en minúsculas, también impide duplicados entre registros nuevos simultáneos. Esto da el error P2002, que `errorHandler` convierte en 409.

### Limitaciones conocidas (aceptadas)
- `LOWER(email)` no usa el índice único, así que PostgreSQL recorre la tabla `users` completa en cada búsqueda. Con el tamaño actual da igual. Si crece, la solución sería un índice funcional, que requiere una migración y queda fuera de este alcance.
- Queda una carrera muy improbable: un registro de `demo@…` que ocurra exactamente al mismo tiempo que existe un `Demo@…` antiguo pasaría la comprobación. Evitarlo del todo requiere un índice único sobre `LOWER(email)`, que también es una migración.

## Verificación
Desde `backend/`:
1. `npx tsc --noEmit` debe compilar sin errores.
2. Con `npm run dev` y la base de datos de desarrollo con el seed cargado, probar con curl:
   - Registrar `Nuevo.User@Test.co` responde 201 y el usuario devuelto tiene `email: "nuevo.user@test.co"`. Comprobarlo también en `npx prisma studio`.
   - Registrar `nuevo.user@test.co` y luego `NUEVO.USER@TEST.CO` responde 409 «Ya existe una cuenta…».
   - Iniciar sesión con `DEMO@agromarket.co` / `agromarket123` responde 200.
   - Correo antiguo con mayúsculas: en Prisma Studio cambiar a mano el correo de un usuario de prueba a `Maria.Gomez@agromarket.co`. Luego iniciar sesión con `maria.gomez@agromarket.co` debe responder 200, y registrar `maria.gomez@agromarket.co` debe responder 409.
   - Con comodines: `juanXperez@test.co` registrado no debe permitir entrar como `juan_perez@test.co`.
   - Recuperación: `/recuperar` con `DEMO@agromarket.co` debe imprimir el código en la consola si SMTP no está configurado. Después, `/recuperar/verificar` y `/recuperar/restablecer` con el correo en minúsculas responden 200, y el login con la nueva contraseña funciona.
3. Hacer commit en `feat/normalizar-email` (ver «Rama» abajo) incluyendo solo `auth.schemas.ts` y `auth.routes.ts`. No se hace push.

## Rama (antes de editar)
1. Ejecutar `git switch master`. Los cambios sin commitear (`.vscode/extensions.json` y `.claude/launch.json`) se llevan tal cual y no entran en ningún commit.
2. Ejecutar `git pull --ff-only` para traer el PR #2 (CLAUDE.md y skills) sin crear un commit de merge. Si no se puede hacer fast-forward, me detengo y te aviso.
3. Confirmar con `git rev-parse --short HEAD` que `master` quedó en `b269777`. Si es otro commit, me detengo y te aviso antes de seguir.
4. Ejecutar `git switch -c feat/normalizar-email` desde ese `master` actualizado. No se crea desde `chore/memoria-y-skills`.
