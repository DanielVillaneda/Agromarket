import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { ProductoPage } from './producto.page';
import { VendedorPage } from '../vendedor/vendedor.page';
import { environment } from '../../../environments/environment';

const api = environment.apiUrl;
// Ids distintos a propósito: el enlace debe usar el sellerId, no el id del producto
const PRODUCTO_ID = 31;
const VENDEDOR_ID = 34;

/** Producto con la forma real que devuelve el backend (serializeProduct). */
function apiProduct(id: number, title: string) {
  return {
    id,
    title,
    price: 12000,
    location: 'Huila',
    icon: 'leaf',
    accent: '#2e7d32',
    description: 'Café de altura cultivado en el Huila',
    notas: null,
    categoria: null,
    quantity: 10,
    unit: 'kilo',
    photos: [],
    sellerId: VENDEDOR_ID,
    sellerName: 'Carlos Pérez',
    sellerPhone: '3000000000',
    sellerEmail: 'carlos.perez@agromarket.co',
    ratingAverage: null,
    ratingCount: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('ProductoPage: enlace al perfil del vendedor (spec 005, CA3)', () => {
  let harness: RouterTestingHarness;
  let http: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'producto/:id', component: ProductoPage },
          { path: 'vendedor/:id', component: VendedorPage },
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create();

    // Given: un visitante sin sesión abre el detalle (sin sesión no se pide GET /reviews)
    await harness.navigateByUrl(`/producto/${PRODUCTO_ID}`, ProductoPage);
    TestBed.tick();
    http
      .match((req) => req.url !== `${api}/products/${PRODUCTO_ID}`)
      .forEach((req) => req.flush(req.request.url === `${api}/cart` ? { items: [], total: 0, count: 0 } : []));
    http
      .expectOne({ method: 'GET', url: `${api}/products/${PRODUCTO_ID}` })
      .flush(apiProduct(PRODUCTO_ID, 'Café especial'));
    harness.detectChanges();
  });

  afterEach(() => {
    try {
      http.verify();
    } finally {
      TestBed.resetTestingModule();
    }
  });

  const raiz = (): HTMLElement => harness.routeNativeElement as HTMLElement;
  const limpio = (el: Element | null): string => (el?.textContent ?? '').replace(/\s+/g, ' ').trim();
  const enlaceVendedor = (): HTMLAnchorElement | null =>
    raiz().querySelector<HTMLAnchorElement>('.producto-seller-name a.producto-seller-link');

  it('Given el detalle del producto 31 del vendedor 34, When se muestra, Then el nombre del vendedor es un enlace con href="/vendedor/34"', () => {
    const enlace = enlaceVendedor();
    expect(enlace).not.toBeNull();
    expect(limpio(enlace)).toBe('Carlos Pérez');
    expect(enlace!.getAttribute('href')).toBe(`/vendedor/${VENDEDOR_ID}`);
    expect(enlace!.getAttribute('href')).not.toBe(`/vendedor/${PRODUCTO_ID}`);
  });

  it('Given el detalle del producto, When el comprador hace clic en el nombre del vendedor, Then llega a /vendedor/34 y ve el perfil de ese vendedor', async () => {
    const router = TestBed.inject(Router);
    expect(router.url).toBe(`/producto/${PRODUCTO_ID}`);

    enlaceVendedor()!.click();
    await harness.fixture.whenStable();
    harness.detectChanges();

    // Llegó a la ruta del perfil y se montó la página del vendedor
    expect(router.url).toBe(`/vendedor/${VENDEDOR_ID}`);
    expect(harness.routeDebugElement?.componentInstance).toBeInstanceOf(VendedorPage);

    // La página del perfil pide los datos de ese vendedor, no de otro
    http.expectOne({ method: 'GET', url: `${api}/products/seller/${VENDEDOR_ID}` }).flush({
      id: VENDEDOR_ID,
      nombre: 'Carlos Pérez',
    });
    http
      .expectOne(
        (req) =>
          req.method === 'GET' &&
          req.url === `${api}/products` &&
          req.params.get('sellerId') === String(VENDEDOR_ID),
      )
      .flush([apiProduct(PRODUCTO_ID, 'Café especial'), apiProduct(32, 'Panela orgánica')]);
    harness.detectChanges();

    expect(limpio(raiz().querySelector('h1.vendedor-nombre'))).toBe('Carlos Pérez');
    const hrefs = Array.from(raiz().querySelectorAll('.product-grid > a.product-link')).map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual([`/producto/${PRODUCTO_ID}`, '/producto/32']);
    expect(limpio(raiz().querySelector('p.vendedor-conteo'))).toBe('2 productos en venta');
  });
});
