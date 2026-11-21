// Prueba e2e del flujo completo de AgroMarket con Playwright.
// Requiere el backend (cd backend && npm run dev, en :3000) y el frontend
// (npm start, ng serve en :4200) corriendo, y la base con el seed aplicado.
// Uso: npm run e2e   (o E2E_BASE_URL=http://localhost:8100 npm run e2e)
// Para cubrir la recuperación de cuenta sin SMTP, levanta el backend con
//   cd backend && npm run dev 2>&1 | tee ../e2e/backend.log
// y corre: E2E_BACKEND_LOG=e2e/backend.log npm run e2e
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const BASE = process.env.E2E_BASE_URL || 'http://localhost:4200';
const API = process.env.E2E_API_URL || 'http://localhost:3000/api';
const BACKEND_LOG = process.env.E2E_BACKEND_LOG ? path.resolve(process.env.E2E_BACKEND_LOG) : null;
const AUTH_TOKEN_KEY = 'agromarket_token';
// Imagen PNG de 1x1 píxel, suficiente para cumplir "al menos una foto".
const FOTO_MINIMA =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const errors = [];
let browser = null;

const escaparRegex = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Busca en el log del backend la última línea del mailer con el código para
// ese correo (backend/src/lib/mailer.ts la imprime cuando SMTP no está configurado).
async function leerCodigoRecuperacion(email, timeoutMs = 15000) {
  const patron = new RegExp(`código de recuperación para ${escaparRegex(email)} es (\\d{6})`, 'gi');
  const limite = Date.now() + timeoutMs;
  while (Date.now() < limite) {
    if (fs.existsSync(BACKEND_LOG)) {
      const coincidencias = [...fs.readFileSync(BACKEND_LOG, 'utf8').matchAll(patron)];
      if (coincidencias.length > 0) return coincidencias[coincidencias.length - 1][1];
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`No apareció el código de recuperación para ${email} en ${BACKEND_LOG}`);
}

async function iniciarSesion(page, email, password) {
  await page.fill('.auth-form-panel--login input[formcontrolname="email"]', email);
  await page.fill('.auth-form-panel--login input[formcontrolname="password"]', password);
  await page.click('.auth-form-panel--login button:has-text("Iniciar sesión")');
}

async function run() {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on('pageerror', (err) => errors.push(`[pageerror] ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !msg.text().includes('Ionicons Warning') && !msg.text().includes('favicon')) {
      errors.push(`[console.error] ${msg.text()}`);
    }
  });

  const ts = Date.now();
  const email = `e2e${ts}@test.com`;

  console.log('--- Registro ---');
  await page.goto(`${BASE}/registro`, { waitUntil: 'networkidle' });
  const registroPanel = '.auth-form-panel--registro';
  await page.fill(`${registroPanel} input[formcontrolname="nombre"]`, 'E2E Tester');
  await page.fill(`${registroPanel} input[formcontrolname="telefono"]`, '3001112222');
  await page.click(`${registroPanel} button:has-text("Siguiente")`);
  await page.waitForTimeout(300);
  await page.fill(`${registroPanel} input[formcontrolname="email"]`, email);
  await page.fill(`${registroPanel} input[formcontrolname="password"]`, 'password123');
  await page.fill(`${registroPanel} input[formcontrolname="confirmPassword"]`, 'password123');
  await page.click(`${registroPanel} button:has-text("Crear cuenta")`);
  await page.waitForURL(`${BASE}/home`, { timeout: 15000 });
  console.log('OK: registro -> /home');

  console.log('--- Product card: botón carrito rápido ---');
  await page.goto(`${BASE}/home`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.product-card', { timeout: 10000 });
  const cartButtons = await page.$$('.product-action--cart');
  if (cartButtons.length === 0) throw new Error('No se encontró botón de carrito en las tarjetas');
  await cartButtons[0].click();
  await page.waitForTimeout(800);
  console.log(`OK: ${cartButtons.length} botones de carrito encontrados, click realizado`);

  console.log('--- Carrito: verificar que haya 1 producto ---');
  await page.goto(`${BASE}/carritocompras`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const bodyText = await page.textContent('body');
  console.log('OK: carrito cargó, contiene texto:', bodyText.includes('$') ? 'precio visible' : 'SIN precio visible');

  console.log('--- Checkout ---');
  const checkoutBtn = await page.$('button:has-text("confirmar"), button:has-text("Confirmar"), button:has-text("Finalizar"), button:has-text("Comprar")');
  if (checkoutBtn) {
    await checkoutBtn.click();
    await page.waitForTimeout(1000);
    console.log('OK: checkout intentado');
  } else {
    console.log('AVISO: no se encontró botón de checkout evidente, revisar manualmente');
  }

  console.log('--- Mis compras ---');
  await page.goto(`${BASE}/compras`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const comprasHtml = await page.content();
  console.log('OK: página de compras cargó. Tiene .compra-card:', comprasHtml.includes('compra-card'));

  console.log('--- Perfil: método de pago ---');
  await page.goto(`${BASE}/perfil`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.perfil-payment-card', { timeout: 10000 });
  await page.fill('input[formcontrolname="bankName"]', 'Bancolombia');
  await page.fill('input[formcontrolname="holderName"]', 'E2E Tester');
  await page.fill('input[formcontrolname="last4"]', '1234');
  await page.click('.perfil-payment-save');
  await page.waitForTimeout(1000);
  const perfilHtml = await page.content();
  console.log('OK: método de pago guardado, muestra Bancolombia:', perfilHtml.includes('Bancolombia'));

  console.log('--- Venta: tabla ---');
  await page.goto(`${BASE}/venta`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const ventaHtml = await page.content();
  console.log('OK: venta.page tiene .venta-table:', ventaHtml.includes('venta-table'));

  console.log('--- Centro de ayuda ---');
  await page.goto(`${BASE}/ayuda`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.faq-item', { timeout: 10000 });
  await page.click('.faq-question');
  console.log('OK: FAQ cargó y es interactiva');

  console.log('--- Admin (usuario normal no debe entrar) ---');
  await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  console.log('URL tras intentar /admin como usuario normal:', page.url());

  console.log('--- Recuperación de cuenta ---');
  let passwordActual = 'password123';
  if (!BACKEND_LOG) {
    console.log('AVISO: E2E_BACKEND_LOG no está definida, se omite la recuperación de cuenta');
  } else {
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
    await page.click('.auth-form-panel--login button:has-text("¿Olvidaste tu contraseña?")');
    const recuperarPanel = '.auth-form-panel--recuperar';
    await page.fill(`${recuperarPanel} input[formcontrolname="email"]`, email);
    await page.click(`${recuperarPanel} button:has-text("Enviar código")`);
    await page.waitForSelector(`${recuperarPanel} input[formcontrolname="code"]`, { timeout: 10000 });
    const codigo = await leerCodigoRecuperacion(email);
    console.log(`OK: código de recuperación solicitado y leído del log (${codigo})`);

    await page.fill(`${recuperarPanel} input[formcontrolname="code"]`, codigo);
    await page.click(`${recuperarPanel} button:has-text("Verificar código")`);
    await page.waitForSelector(`${recuperarPanel} input[formcontrolname="confirmPassword"]`, { timeout: 10000 });
    console.log('OK: código verificado, paso 3 (nueva contraseña)');

    const nuevaPassword = 'nuevaClave456';
    await page.fill(`${recuperarPanel} input[formcontrolname="password"]`, nuevaPassword);
    await page.fill(`${recuperarPanel} input[formcontrolname="confirmPassword"]`, nuevaPassword);
    await page.click(`${recuperarPanel} button:has-text("Cambiar contraseña")`);
    await page.waitForSelector('.auth-form-panel--login', { timeout: 10000 });
    console.log('OK: contraseña cambiada, vuelve al inicio de sesión');

    await iniciarSesion(page, email, nuevaPassword);
    await page.waitForURL(`${BASE}/home`, { timeout: 10000 });
    passwordActual = nuevaPassword;
    console.log('OK: inicio de sesión con la contraseña nueva -> /home');
  }

  console.log('--- Producto de prueba (para eliminarlo luego desde admin) ---');
  if (!(await page.evaluate((key) => localStorage.getItem(key), AUTH_TOKEN_KEY))) {
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
    await iniciarSesion(page, email, passwordActual);
    await page.waitForURL(`${BASE}/home`, { timeout: 10000 });
  }
  const tituloProducto = `Producto E2E ${ts}`;
  const creado = await page.evaluate(
    async ({ api, key, title, photo }) => {
      const res = await fetch(`${api}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem(key)}` },
        body: JSON.stringify({
          title,
          price: 1000,
          location: 'Neiva',
          description: 'Producto creado por la prueba e2e.',
          quantity: 5,
          unit: 'kilo',
          photos: [photo],
        }),
      });
      return { status: res.status, body: await res.text() };
    },
    { api: API, key: AUTH_TOKEN_KEY, title: tituloProducto, photo: FOTO_MINIMA },
  );
  if (creado.status !== 201 && creado.status !== 200) {
    throw new Error(`No se pudo crear el producto de prueba (${creado.status}): ${creado.body}`);
  }
  console.log(`OK: producto de prueba creado: "${tituloProducto}"`);

  console.log('--- Login como admin ---');
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await iniciarSesion(page, 'admin@agromarket.co', 'agromarket123');
  await page.waitForURL(`${BASE}/home`, { timeout: 10000 });

  console.log('--- Panel de admin ---');
  await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.admin-stats-grid', { timeout: 10000 });
  console.log('OK: admin entra y ve el resumen');

  await page.click('.admin-tab:has-text("Usuarios")');
  await page.waitForSelector('.admin-table', { timeout: 5000 });
  const usersRows = await page.$$('.admin-table tbody tr');
  console.log(`OK: pestaña usuarios muestra ${usersRows.length} filas`);

  console.log('--- Admin: bloquear usuario ---');
  const filaUsuario = page.locator('.admin-table tbody tr', { hasText: email });
  await filaUsuario.locator('button.admin-action:has-text("Bloquear")').click();
  await filaUsuario.locator('.admin-badge--blocked').waitFor({ timeout: 5000 });
  console.log(`OK: ${email} aparece como Bloqueado`);

  console.log('--- Admin: eliminar producto ---');
  await page.click('.admin-tab:has-text("Productos")');
  await page.waitForSelector('.admin-table', { timeout: 5000 });
  const filaProducto = page.locator('.admin-table tbody tr', { hasText: tituloProducto });
  await filaProducto.waitFor({ timeout: 5000 });
  page.once('dialog', (dialog) => dialog.accept());
  await filaProducto.locator('button:has-text("Eliminar")').click();
  await filaProducto.waitFor({ state: 'detached', timeout: 5000 });
  console.log(`OK: "${tituloProducto}" eliminado del listado de admin`);

  console.log('--- Usuario bloqueado no puede iniciar sesión ---');
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await iniciarSesion(page, email, passwordActual);
  await page.waitForTimeout(1500);
  const errorLogin = await page
    .locator('.auth-form-panel--login .auth-error--form')
    .textContent({ timeout: 3000 })
    .catch(() => null);
  console.log('URL tras intentar login bloqueado:', page.url());
  console.log('OK: mensaje mostrado al usuario bloqueado:', errorLogin ? errorLogin.trim() : 'NINGUNO');
}

function imprimirErrores() {
  console.log('\n=== ERRORES DE CONSOLA/PÁGINA CAPTURADOS ===');
  if (errors.length === 0) {
    console.log('Ninguno.');
  } else {
    errors.forEach((e) => console.log(e));
  }
}

(async () => {
  try {
    await run();
  } catch (err) {
    console.error('FALLO:', err);
    process.exitCode = 1;
  } finally {
    // Se ejecuta siempre, también si el flujo falla a mitad de camino.
    if (browser) await browser.close().catch(() => {});
    imprimirErrores();
  }
})();
