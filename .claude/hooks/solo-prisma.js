#!/usr/bin/env node
// Hook PreToolUse de agente-schema-db.
// - Edit/Write: solo se permiten rutas dentro de backend/prisma/**.
// - Bash: solo comandos que empiecen con `prisma` o `npx prisma`
//   (opcionalmente precedidos de `cd backend &&`, porque Prisma solo está
//   instalado en backend/node_modules y lee backend/.env).
// Cualquier otra llamada se bloquea con código de salida 2; el mensaje de
// stderr le llega al subagente como motivo del bloqueo.

const fs = require('fs');
const path = require('path');

const esWindows = process.platform === 'win32';

function bloquear(motivo) {
  process.stderr.write(`[solo-prisma] Bloqueado: ${motivo}\n`);
  process.exit(2);
}

// Convierte "/c/Users/..." (Git Bash) en "c:/Users/..." y usa siempre "/".
function normalizar(ruta) {
  let r = String(ruta).replace(/\\/g, '/');
  if (esWindows) {
    const gitBash = /^\/([a-zA-Z])(\/|$)/.exec(r);
    if (gitBash) r = `${gitBash[1]}:/${r.slice(3)}`;
  }
  return r;
}

// Resuelve enlaces simbólicos del ancestro existente más cercano, para que
// un symlink dentro de backend/prisma no permita escribir fuera de ella.
function rutaReal(ruta) {
  let actual = ruta;
  const resto = [];
  while (!fs.existsSync(actual)) {
    const padre = path.dirname(actual);
    if (padre === actual) return ruta;
    resto.unshift(path.basename(actual));
    actual = padre;
  }
  try {
    return path.join(fs.realpathSync.native(actual), ...resto);
  } catch {
    return ruta;
  }
}

function claveComparable(ruta) {
  const r = path.resolve(normalizar(ruta));
  return esWindows ? r.toLowerCase() : r;
}

function dentroDe(ruta, carpeta) {
  const rel = path.relative(claveComparable(carpeta), claveComparable(ruta));
  return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel);
}

function validarArchivo(entrada, raizProyecto) {
  const filePath = entrada.tool_input && entrada.tool_input.file_path;
  if (!filePath) bloquear('la llamada no trae tool_input.file_path.');

  const absoluta = path.resolve(raizProyecto, normalizar(filePath));
  const permitida = path.join(raizProyecto, 'backend', 'prisma');

  if (!dentroDe(rutaReal(absoluta), rutaReal(permitida))) {
    bloquear(
      `agente-schema-db solo puede editar archivos dentro de backend/prisma/. ` +
        `Ruta pedida: ${filePath}`,
    );
  }
}

function validarComando(entrada) {
  const comando = String((entrada.tool_input && entrada.tool_input.command) || '').trim();
  if (!comando) bloquear('comando vacío.');

  // Prefijo opcional "cd backend &&" y luego "prisma" o "npx prisma".
  const patron = /^(?:cd\s+(["']?)(?:\.\/)?backend\/?\1\s*&&\s*)?(?:npx\s+)?prisma(?:\s|$)/;
  const coincide = patron.exec(comando);
  if (!coincide) {
    bloquear(
      'agente-schema-db solo puede ejecutar comandos que empiecen con `prisma` o ' +
        '`npx prisma` (opcionalmente `cd backend && npx prisma ...`). ' +
        `Comando pedido: ${comando}`,
    );
  }

  // Lo que sigue al prefijo permitido no puede encadenar ni redirigir otros
  // comandos (;, &, |, `, $, <, >, saltos de línea).
  const resto = comando.slice(coincide[0].length);
  if (/[;&|`$<>\r\n]/.test(resto)) {
    bloquear(
      'el comando contiene encadenamiento, sustitución o redirección de shell, ' +
        `que no está permitido. Comando pedido: ${comando}`,
    );
  }
}

let datos = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (trozo) => (datos += trozo));
process.stdin.on('end', () => {
  let entrada;
  try {
    entrada = JSON.parse(datos);
  } catch {
    bloquear('no se pudo leer la entrada JSON del hook.');
  }

  const raizProyecto = normalizar(
    process.env.CLAUDE_PROJECT_DIR || entrada.cwd || process.cwd(),
  );

  switch (entrada.tool_name) {
    case 'Edit':
    case 'Write':
      validarArchivo(entrada, raizProyecto);
      break;
    case 'Bash':
      validarComando(entrada);
      break;
    default:
      // El matcher del frontmatter solo envía Edit, Write y Bash.
      break;
  }
  process.exit(0);
});
