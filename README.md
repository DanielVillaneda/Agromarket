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

El sistema tiene 6 subagentes de Claude Code y un orquestador. Cada subagente es un archivo Markdown con frontmatter YAML en `.claude/agents/`.

| Subagente | Archivo | Herramientas | Modelo |
|---|---|---|---|
| `agente-schema-db` | [`.claude/agents/agente-schema-db.md`](.claude/agents/agente-schema-db.md) | Read, Grep, Glob, Edit, Write, Bash (con hook) | opus |
| `agente-api-backend` | [`.claude/agents/agente-api-backend.md`](.claude/agents/agente-api-backend.md) | Read, Grep, Glob, Edit, Bash | sonnet |
| `agente-ui-frontend` | [`.claude/agents/agente-ui-frontend.md`](.claude/agents/agente-ui-frontend.md) | Read, Grep, Glob, Edit, Bash | sonnet |
| `agente-accesibilidad` | [`.claude/agents/agente-accesibilidad.md`](.claude/agents/agente-accesibilidad.md) | Read, Grep, Edit, WebFetch | haiku |
| `agente-pruebas` | [`.claude/agents/agente-pruebas.md`](.claude/agents/agente-pruebas.md) | Read, Grep, Glob, Edit, Bash | opus |
| `agente-e2e` | [`.claude/agents/agente-e2e.md`](.claude/agents/agente-e2e.md) | Read, Bash (`disallowedTools: Edit, Write`) | haiku |

#### El orquestador vive en `CLAUDE.md`

Este es un cambio respecto al diseño del taller, que lo planteaba como un agente más con `tools: [Task]`. El orquestador no es un archivo de subagente. Es la sección "Sistema de agentes" de [`CLAUDE.md`](CLAUDE.md), que el agente principal sigue cuando una tarea requiere delegar. Esa sección define el orden de delegación y obliga a pedirle `npx tsc --noEmit` a `agente-api-backend` después de cada cambio de schema. También aclara que los subagentes no se comunican entre sí.

El motivo es que Claude Code no ofrece un mecanismo para que un subagente se limite a coordinar. Los subagentes no hablan entre sí y solo devuelven su resultado al agente principal, así que la coordinación tiene que ocurrir en la conversación principal.

#### Restricciones: un hook real y cinco por instrucciones

- **Solo `agente-schema-db` tiene un refuerzo técnico.** Tiene un hook `PreToolUse` en su frontmatter que ejecuta [`.claude/hooks/solo-prisma.js`](.claude/hooks/solo-prisma.js). Ese hook solo permite Edit y Write dentro de `backend/prisma/**` y comandos Bash que empiecen con `prisma` o `npx prisma`, opcionalmente precedidos de `cd backend &&`. Bloquea con código 2 cualquier otra ruta y también el encadenamiento, la sustitución y la redirección de shell. Lo tiene porque es el agente de mayor riesgo: un cambio de base de datos aplicado es difícil de revertir.
- **Los otros 5 subagentes no tienen refuerzo técnico.** Sus límites de carpeta y de comandos están escritos solo en su system prompt (el cuerpo del archivo), así que dependen de que el modelo los respete. Es una limitación conocida, no un error. En los campos `tools` y `disallowedTools`, Claude Code no permite restringir Edit o Write por ruta, ni Bash por patrón: `disallowedTools: Bash(git push *)` quita Bash entero. Para un refuerzo real habría que darles un hook propio a cada uno.

#### Pruebas que hicimos

- **Hook en aislamiento:** 26 casos simulados, todos correctos. Se le pasaron entradas JSON de Edit, Write y Bash, con rutas de Windows, rutas con `/`, rutas estilo Git Bash, mayúsculas distintas, intentos de salir con `..`, una carpeta con un nombre parecido (`prisma-malo`) y comandos encadenados con `&&`, `;` y `$()`.
- **Dos invocaciones reales de `agente-schema-db`:**
  - En la primera se le pidió agregar el campo opcional `notas` a `Product`. Editó solo `schema.prisma`, generó la migración con `npx prisma migrate dev` y dejó anotado que faltaba `tsc` para `agente-api-backend`.
  - En la segunda se le pidió, además, editar `backend/src/modules/products/product.schemas.ts`. Leyó el archivo, se negó a editarlo y explicó que está fuera de su alcance. También dejó las instrucciones para `agente-api-backend`.
  - En las dos, sus instrucciones bastaron como primera barrera. El hook no llegó a bloquear nada porque el agente nunca intentó salirse de sus límites. Por eso el bloqueo solo está comprobado con los casos simulados, no en una ejecución real. Los cambios de las dos pruebas se revirtieron: schema, migración, base de datos y cliente de Prisma.

#### Prueba de extremo a extremo

[`e2e/e2e-check.js`](e2e/e2e-check.js) es el script que ejecuta `agente-e2e`. Usa Playwright y recorre registro, carrito, checkout, compras, perfil con método de pago, recuperación de cuenta, panel de admin, bloqueo de usuario y eliminación de un producto.

`agente-e2e` corrió el flujo completo contra el proyecto real, con el backend en `:3000` y PostgreSQL local, el frontend con `ng serve` en `:4200` y la base con el seed aplicado. Las 16 secciones pasaron y el script terminó con código de salida 0. El único error de consola capturado fue un 403, que es el esperado cuando el usuario bloqueado intenta iniciar sesión.

El agente se mantuvo dentro de sus límites. En su transcripción solo aparecen tres llamadas: el curl de comprobación de los dos servidores, la lectura del script y `npm run e2e`. No usó Edit ni Write, que además tiene quitados con `disallowedTools`.

En su reporte también señaló una debilidad del script: el paso de checkout solo comprueba que se hizo clic, no que la compra se haya creado.

Cómo correrlo:

```bash
cd backend && npm run dev 2>&1 | tee ../e2e/backend.log   # terminal 1
npm start                                                  # terminal 2
E2E_BACKEND_LOG=e2e/backend.log npm run e2e                # terminal 3
```

`E2E_BACKEND_LOG` es opcional. Sin ella se omite la recuperación de cuenta, porque sin SMTP el código solo aparece en la salida del backend.

### Mecanismos de calidad

No se alcanzó a completar esta parte de forma formal, por el tiempo que tomaron las 5 specs de
la Parte 3 y porque se agotaron los créditos de Claude Code hacia el final del proyecto. Aun así,
ya existe evidencia real de dos de los mecanismos propuestos en el taller, usada de forma orgánica
durante las 5 specs, aunque sin documentarse aquí formalmente:

1. **Pruebas desde criterios de aceptación.** Cada spec (`specs/001-notas-producto` a
   `specs/005-perfil-vendedor`) tiene su `spec.md` con criterios de aceptación verificables y su
   `tasks.md` con las pruebas reales que los comprobaron (curl contra la API y specs de Angular).
   Este mecanismo encontró y corrigió 2 bugs reales: una validación que aceptaba tipos inválidos
   en la calificación de productos (ver "Ajustes durante la implementación" en
   `specs/003-calificacion-productos/spec.md`) y un id fuera de rango que devolvía un error 500 en
   vez de 400 (ver `specs/005-perfil-vendedor/spec.md`).
2. **Prueba end-to-end con Playwright** (`e2e/e2e-check.js`, ejecutada por `agente-e2e`). Se corrió
   completa y con éxito una vez, documentada en la sección "Sistema de agentes" de este README,
   pero no se volvió a correr después de fusionar las 5 specs, por falta de tiempo.

Queda pendiente formalizar esto como entregable completo: enlazar la evidencia de cada spec desde
aquí, y una corrida de cierre de `agente-e2e` sobre las 5 specs ya fusionadas.
