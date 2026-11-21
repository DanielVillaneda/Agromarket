import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { VendedorPage } from './vendedor.page';
import { AUTH_TOKEN_KEY } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

const api = environment.apiUrl;

const NO_ENCONTRADO = 'No encontramos este vendedor.';
const ERROR_GENERICO = 'No pudimos cargar el perfil del vendedor. Intenta de nuevo.';
const SIN_PRODUCTOS = 'Este vendedor aún no tiene productos en venta.';

/** Producto con la forma real que devuelve GET /api/products (serializeProduct). */
function apiProduct(id: number, title: string, sellerId: number, sellerName: string) {
  return {
    id,
    title,
    price: 8000,
    location: 'Rivera · Huila',
    icon: 'leaf-outline',
    accent: '#4caf50',
    description: 'Producto fresco de la región',
    notas: null,
    categoria: null,
    quantity: 20,
    unit: 'kilo',
    photos: [],
    sellerId,
    sellerName,
    sellerPhone: '3000000000',
    sellerEmail: 'demo@agromarket.co',
    ratingAverage: null,
    ratingCount: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

const PRODUCTOS_DEMO = [
  apiProduct(25, 'Aguacate Hass', 36, 'Usuario Demo'),
  apiProduct(24, 'Café Orgánico de Altura', 36, 'Usuario Demo'),
];

describe('VendedorPage: perfil público del vendedor (spec 005, CA1 y CA2)', () => {
  let harness: RouterTestingHarness;
  let http: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'vendedor/:id', component: VendedorPage }]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create();
  });

  afterEach(() => {
    // Si verify falla, se reinicia igual el TestBed para no arrastrar el fallo
    try {
      http.verify();
    } finally {
      TestBed.resetTestingModule();
    }
  });

  const raiz = (): HTMLElement => harness.routeNativeElement as HTMLElement;
  const q = (sel: string): HTMLElement | null => raiz().querySelector<HTMLElement>(sel);
  const limpio = (el: Element | null): string => (el?.textContent ?? '').replace(/\s+/g, ' ').trim();
  const texto = (sel: string): string | null => (q(sel) ? limpio(q(sel)) : null);
  const tarjetas = (): HTMLAnchorElement[] =>
    Array.from(raiz().querySelectorAll<HTMLAnchorElement>('.product-grid > a.product-link'));
  const titulos = (): string[] => tarjetas().map((a) => limpio(a.querySelector('app-product-card .product-title')));

  /** Peticiones propias del perfil: GET /products/seller/N y GET /products?sellerId=N. */
  const esPerfil = (url: string) => url.startsWith(`${api}/products/seller/`);
  const esProductosVendedor = (req: { url: string; params: { has(k: string): boolean } }) =>
    req.url === `${api}/products` && req.params.has('sellerId');

  /** Responde las cargas del effect del servicio (mercado, buscador y, con sesión, carrito, etc.). */
  function responderCargasDelServicio(): void {
    TestBed.tick();
    http
      .match((req) => !esPerfil(req.url) && !esProductosVendedor(req))
      .forEach((req) => req.flush(req.request.url === `${api}/cart` ? { items: [], total: 0, count: 0 } : []));
  }

  /** Navega como lo haría el usuario y responde las cargas ajenas al perfil. */
  async function abrir(url: string): Promise<void> {
    await harness.navigateByUrl(url);
    responderCargasDelServicio();
    harness.detectChanges();
  }

  function peticionPerfil(id: number): TestRequest {
    return http.expectOne({ method: 'GET', url: `${api}/products/seller/${id}` });
  }

  function peticionProductos(id: number): TestRequest {
    return http.expectOne(
      (req) => req.method === 'GET' && esProductosVendedor(req) && req.params.get('sellerId') === String(id),
    );
  }

  /** Responde con éxito las dos peticiones del perfil. */
  function responderPerfil(id: number, nombre: string, productos: unknown[]): void {
    peticionPerfil(id).flush({ id, nombre });
    peticionProductos(id).flush(productos);
    harness.detectChanges();
  }

  /** Responde un error a las dos peticiones (forkJoin cancela la segunda al fallar la primera). */
  function responderError(primera: TestRequest, segunda: TestRequest, cuerpo: object, status: number, statusText: string): void {
    primera.flush(cuerpo, { status, statusText });
    if (!segunda.cancelled) {
      segunda.flush(cuerpo, { status, statusText });
    }
    harness.detectChanges();
  }

  /** Estado "vendedor no encontrado": alerta, enlace al inicio, sin h1, sin grilla y sin mensaje de vacío. */
  function esperarNoEncontrado(): void {
    expect(texto('p.vendedor-error[role=alert]')).toBe(NO_ENCONTRADO);
    expect(q('a.vendedor-volver')?.getAttribute('href')).toBe('/home');
    expect(q('h1.vendedor-nombre')).toBeNull();
    expect(q('.product-grid')).toBeNull();
    expect(tarjetas().length).toBe(0);
    expect(q('p.vendedor-vacio')).toBeNull();
    expect(q('p.vendedor-cargando')).toBeNull();
  }

  describe('CA1: vendedor con productos', () => {
    it('Given el vendedor 36 tiene 2 productos, When un visitante sin sesión entra a /vendedor/36, Then ve su nombre en el h1, 2 tarjetas enlazadas a /producto/ID y "2 productos en venta"', async () => {
      await abrir('/vendedor/36');

      // Antes de las respuestas: estado de carga, sin nombre ni grilla
      expect(texto('p.vendedor-cargando[role=status]')).not.toBeNull();
      expect(q('h1.vendedor-nombre')).toBeNull();
      expect(q('.product-grid')).toBeNull();

      responderPerfil(36, 'Usuario Demo', PRODUCTOS_DEMO);

      expect(q('p.vendedor-cargando')).toBeNull();
      expect(texto('h1.vendedor-nombre')).toBe('Usuario Demo');
      expect(tarjetas().length).toBe(2);
      expect(tarjetas().map((a) => a.getAttribute('href'))).toEqual(['/producto/25', '/producto/24']);
      expect(titulos()).toEqual(['Aguacate Hass', 'Café Orgánico de Altura']);
      expect(texto('p.vendedor-conteo')).toBe('2 productos en venta');
      expect(q('p.vendedor-vacio')).toBeNull();
      expect(q('.vendedor-error')).toBeNull();
    });

    it('Given el vendedor tiene un solo producto, When se abre su perfil, Then el conteo dice "1 producto en venta" en singular', async () => {
      await abrir('/vendedor/36');
      responderPerfil(36, 'Usuario Demo', [PRODUCTOS_DEMO[0]]);

      expect(tarjetas().length).toBe(1);
      expect(texto('p.vendedor-conteo')).toBe('1 producto en venta');
    });

    it('Given el usuario con sesión es el propio vendedor 36, When entra a /vendedor/36, Then también ve sus productos', async () => {
      localStorage.setItem(AUTH_TOKEN_KEY, 'token-de-prueba');
      localStorage.setItem(
        'agromarket_user',
        JSON.stringify({ id: 36, nombre: 'Usuario Demo', email: 'demo@agromarket.co', telefono: null, role: 'user' }),
      );

      await abrir('/vendedor/36');
      responderPerfil(36, 'Usuario Demo', PRODUCTOS_DEMO);

      expect(texto('h1.vendedor-nombre')).toBe('Usuario Demo');
      expect(tarjetas().map((a) => a.getAttribute('href'))).toEqual(['/producto/25', '/producto/24']);
    });
  });

  describe('CA1: vendedor sin productos', () => {
    it('Given el vendedor 37 no tiene productos, When se abre /vendedor/37, Then ve su nombre y "Este vendedor aún no tiene productos en venta." sin grilla', async () => {
      await abrir('/vendedor/37');
      expect(q('p.vendedor-vacio')).toBeNull();

      responderPerfil(37, 'Administrador AgroMarket', []);

      expect(texto('h1.vendedor-nombre')).toBe('Administrador AgroMarket');
      expect(texto('p.vendedor-vacio')).toBe(SIN_PRODUCTOS);
      expect(q('.product-grid')).toBeNull();
      expect(tarjetas().length).toBe(0);
      expect(q('.vendedor-error')).toBeNull();
    });
  });

  describe('CA2: vendedor inexistente o id inválido', () => {
    it('Given el id 999999 no existe, When la API responde 404 en los productos y en el perfil, Then se ve "No encontramos este vendedor." en role=alert, sin h1 ni grilla', async () => {
      await abrir('/vendedor/999999');
      const perfil = peticionPerfil(999999);
      const productos = peticionProductos(999999);

      responderError(productos, perfil, { message: NO_ENCONTRADO }, 404, 'Not Found');

      esperarNoEncontrado();
    });

    it('Given el id 999999 no existe, When el perfil responde 404 primero, Then también se ve el error de vendedor no encontrado', async () => {
      await abrir('/vendedor/999999');
      const perfil = peticionPerfil(999999);
      const productos = peticionProductos(999999);

      responderError(perfil, productos, { message: NO_ENCONTRADO }, 404, 'Not Found');

      esperarNoEncontrado();
    });

    it('Given la API responde 400 al id, When se abre el perfil, Then se trata como vendedor no encontrado', async () => {
      await abrir('/vendedor/2147483647');
      const perfil = peticionPerfil(2147483647);
      const productos = peticionProductos(2147483647);

      responderError(perfil, productos, { message: 'El id debe ser un número entero positivo.' }, 400, 'Bad Request');

      esperarNoEncontrado();
    });

    for (const idInvalido of ['abc', '0', '-1', '1.5', '1e3', '99999999999999999999']) {
      it(`Given el id "${idInvalido}" no es un entero positivo, When se abre /vendedor/${idInvalido}, Then se ve "No encontramos este vendedor." sin ninguna petición del perfil`, async () => {
        await abrir(`/vendedor/${idInvalido}`);

        http.expectNone((req) => esPerfil(req.url));
        http.expectNone((req) => esProductosVendedor(req));
        esperarNoEncontrado();
      });
    }
  });

  describe('Otros errores', () => {
    it('Given la API falla con 500, When se abre el perfil, Then se ve el mensaje genérico y no el de "no encontrado"', async () => {
      await abrir('/vendedor/36');
      const perfil = peticionPerfil(36);
      const productos = peticionProductos(36);

      responderError(perfil, productos, { message: 'Error interno del servidor.' }, 500, 'Internal Server Error');

      expect(texto('p.vendedor-error')).toBe(ERROR_GENERICO);
      expect(q('h1.vendedor-nombre')).toBeNull();
      expect(q('.product-grid')).toBeNull();
    });

    it('Given no hay conexión (status 0), When se abre el perfil, Then se ve el mensaje genérico', async () => {
      await abrir('/vendedor/36');
      const perfil = peticionPerfil(36);
      const productos = peticionProductos(36);

      productos.error(new ProgressEvent('error'));
      if (!perfil.cancelled) {
        perfil.error(new ProgressEvent('error'));
      }
      harness.detectChanges();

      expect(texto('p.vendedor-error')).toBe(ERROR_GENERICO);
    });
  });

  describe('Cambio de id en la ruta', () => {
    it('Given el perfil de /vendedor/36 cargado, When navega a /vendedor/40, Then se reutiliza la página y se muestra el vendedor 40 con sus productos', async () => {
      await abrir('/vendedor/36');
      responderPerfil(36, 'Usuario Demo', PRODUCTOS_DEMO);
      const paginaInicial = harness.routeDebugElement?.componentInstance;
      expect(texto('h1.vendedor-nombre')).toBe('Usuario Demo');

      await harness.navigateByUrl('/vendedor/40');
      harness.detectChanges();
      // Misma instancia: la recarga sale de paramMap, no de recrear el componente
      expect(harness.routeDebugElement?.componentInstance).toBe(paginaInicial);
      expect(texto('p.vendedor-cargando[role=status]')).not.toBeNull();
      expect(q('h1.vendedor-nombre')).toBeNull();

      responderPerfil(40, 'Carlos Pérez', [apiProduct(30, 'Panela orgánica', 40, 'Carlos Pérez')]);

      expect(texto('h1.vendedor-nombre')).toBe('Carlos Pérez');
      expect(tarjetas().map((a) => a.getAttribute('href'))).toEqual(['/producto/30']);
      expect(titulos()).toEqual(['Panela orgánica']);
      expect(texto('p.vendedor-conteo')).toBe('1 producto en venta');
    });

    it('Given las respuestas de /vendedor/36 no han llegado, When navega a /vendedor/40, Then las peticiones de 36 se cancelan y solo se muestra el vendedor 40', async () => {
      await abrir('/vendedor/36');
      const perfil36 = peticionPerfil(36);
      const productos36 = peticionProductos(36);

      await harness.navigateByUrl('/vendedor/40');
      expect(perfil36.cancelled).toBe(true);
      expect(productos36.cancelled).toBe(true);

      responderPerfil(40, 'Carlos Pérez', []);
      expect(texto('h1.vendedor-nombre')).toBe('Carlos Pérez');
      expect(texto('p.vendedor-vacio')).toBe(SIN_PRODUCTOS);
    });

    it('Given /vendedor/abc mostró el error, When navega a /vendedor/36, Then el error desaparece y se carga el perfil', async () => {
      await abrir('/vendedor/abc');
      esperarNoEncontrado();

      await harness.navigateByUrl('/vendedor/36');
      responderPerfil(36, 'Usuario Demo', PRODUCTOS_DEMO);

      expect(q('.vendedor-error')).toBeNull();
      expect(texto('h1.vendedor-nombre')).toBe('Usuario Demo');
      expect(tarjetas().length).toBe(2);
    });
  });
});
