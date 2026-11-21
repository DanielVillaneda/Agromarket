# AgroMarket

## Arnés del proyecto

El arnés es el conjunto de archivos que le da contexto y reglas a Claude Code cuando trabaja en este repositorio.

### Piezas y ubicación

| Pieza | Tipo | Ubicación | Cuándo se carga |
|---|---|---|---|
| `CLAUDE.md` | Memoria del proyecto | `CLAUDE.md` (raíz) | Al iniciar cada sesión |
| `backend/CLAUDE.md` | Memoria anidada del backend | `backend/CLAUDE.md` | Cuando Claude lee o edita archivos dentro de `backend/` |
| `prisma-safe-migrations` | Skill | `.claude/skills/prisma-safe-migrations/SKILL.md` | Al invocarla o cuando la tarea coincide con su descripción |
| `pruebas-desde-criterios-aceptacion` | Skill | `.claude/skills/pruebas-desde-criterios-aceptacion/SKILL.md` | Al invocarla o cuando la tarea coincide con su descripción |
| `web-design-guidelines` | Skill | `.claude/skills/web-design-guidelines/SKILL.md` | Al invocarla o cuando la tarea coincide con su descripción |

### Skills

Una skill se invoca escribiendo `/<nombre>` en Claude Code. Claude también la activa por su cuenta cuando la tarea coincide con la `description` del frontmatter de su `SKILL.md`.

- **`prisma-safe-migrations`**: flujo seguro para cambiar el modelo de datos sin dañar las migraciones ya aplicadas. Se edita `backend/prisma/schema.prisma`, se genera una migración nueva con `npx prisma migrate dev --name <nombre>` y se comprueba con `npx tsc --noEmit`. Nunca se editan a mano los archivos de `backend/prisma/migrations/`. **Cuándo:** antes de tocar `schema.prisma` o cuando haga falta una migración.
- **`pruebas-desde-criterios-aceptacion`**: convierte un criterio de aceptación (Given/When/Then) en una prueba que falla si el criterio no se cumple. En el backend es un comando curl documentado con su código HTTP y cuerpo esperados. En el frontend es un `.spec.ts` que verifica el signal correspondiente (`getCartQuantity(id)`, `cartCount()`, `isFavorite(id)`) después de la acción del usuario. Prohíbe pruebas vacías, tautológicas o que solo verifican un mock, y exige ver la prueba fallar con el criterio roto. **Cuándo:** al probar o verificar una historia de usuario, o al escribir el test de un criterio.
- **`web-design-guidelines`** (de Vercel): revisa archivos de UI contra las Web Interface Guidelines, que descarga actualizadas en cada revisión, y reporta los hallazgos como `archivo:línea`. **Cuándo:** al pedir una revisión de UI, accesibilidad, UX o diseño; se le pasa un archivo o patrón como argumento.

### Instrucciones y reglas

Las instrucciones y reglas del proyecto se resuelven con la memoria anidada de Claude Code:

- `CLAUDE.md` (raíz) tiene las reglas generales: comandos, arquitectura del frontend y del backend, despliegue y la convención de escribir todo en español.
- `backend/CLAUDE.md` tiene las reglas propias del backend, incluida la lista de lo que el agente no debe hacer. Claude Code lo carga bajo demanda, solo cuando trabaja con archivos de `backend/`, así que funciona como una regla con alcance por carpeta.

Claude Code también admite reglas con alcance por ruta: archivos `.md` en `.claude/rules/` con un frontmatter `paths:` de globs, que se cargan al tocar archivos que coinciden ([documentación](https://code.claude.com/docs/en/memory)). El proyecto decidió no usarlas. Con las dos áreas que tiene hoy (frontend y backend), la memoria anidada alcanza y deja las reglas junto al código que describen.

### Sistema de agentes

Pendiente — se completa en la Parte 2

### Mecanismos de calidad

Pendiente — se completa en la Parte 4
