import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { ProductsService } from './products.service';
import { environment } from '../../environments/environment';

const api = environment.apiUrl;

/** Producto con la forma real que devuelve el backend (serializeProduct). */
function apiProduct(id: number, notas: string | null, categoria: string | null = null) {
  return {
    id,
    title: 'Café especial',
    price: 12000,
    location: 'Huila',
    icon: 'leaf',
    accent: '#2e7d32',
    description: 'Café de altura cultivado en el Huila',
    notas,
    categoria,
    quantity: 10,
    unit: 'kilo',
    photos: [],
    sellerId: 2,
    sellerName: 'Carlos',
    sellerPhone: '3000000000',
    sellerEmail: 'carlos.perez@agromarket.co',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('ProductsService: mapeo de las notas del vendedor', () => {
  let service: ProductsService;
  let http: HttpTestingController;

  beforeEach(() => {
    // Given: visitante sin sesión (test-setup vacía localStorage antes de cada prueba)
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ProductsService);
    http = TestBed.inject(HttpTestingController);
    // El effect del servicio lanza las cargas iniciales (mercado y buscador)
    TestBed.tick();
  });

  afterEach(() => {
    http.verify();
  });

  /** Responde las cargas iniciales que no son objeto de la prueba. */
  function responderCargasIniciales(): void {
    http.match(() => true).forEach((req) => req.flush([]));
  }

  it('Given la API devuelve notas con texto, When se pide el producto, Then Product.notas tiene ese texto', () => {
    responderCargasIniciales();
    let notas: string | undefined | null = null;

    service.getProduct(7).subscribe((p) => (notas = p.notas));
    expect(notas).toBeNull(); // todavía no llegó la respuesta

    http
      .expectOne({ method: 'GET', url: `${api}/products/7` })
      .flush(apiProduct(7, 'Disponible solo los fines de semana'));

    expect(notas).toBe('Disponible solo los fines de semana');
  });

  it('Given la API devuelve notas: null, When se pide el producto, Then Product.notas es undefined', () => {
    responderCargasIniciales();
    let recibido = false;
    let notas: string | undefined | null = 'valor-inicial';

    service.getProduct(8).subscribe((p) => {
      recibido = true;
      notas = p.notas;
    });
    http.expectOne({ method: 'GET', url: `${api}/products/8` }).flush(apiProduct(8, null));

    expect(recibido).toBe(true);
    expect(notas).toBeUndefined();
  });

  it('Given el mercado trae un producto con notas y otro con notas: null, When llega la carga, Then marketProducts() conserva el texto y deja undefined', () => {
    expect(service.marketProducts()).toEqual([]);

    http
      .expectOne((req) => req.url === `${api}/products` && !req.params.has('includeMine'))
      .flush([apiProduct(1, 'Se entrega en la plaza de mercado de Neiva'), apiProduct(2, null)]);
    responderCargasIniciales();

    const [conNotas, sinNotas] = service.marketProducts();
    expect(conNotas.notas).toBe('Se entrega en la plaza de mercado de Neiva');
    expect(sinNotas.notas).toBeUndefined();
  });
});

describe('ProductsService: mapeo de la categoría del producto (spec 002)', () => {
  let service: ProductsService;
  let http: HttpTestingController;

  beforeEach(() => {
    // Given: visitante sin sesión
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ProductsService);
    http = TestBed.inject(HttpTestingController);
    TestBed.tick();
  });

  afterEach(() => {
    http.verify();
  });

  function responderCargasIniciales(): void {
    http.match(() => true).forEach((req) => req.flush([]));
  }

  it('Given la API devuelve categoria "Frutas", When se pide el producto, Then Product.categoria es "Frutas"', () => {
    responderCargasIniciales();
    let categoria: string | undefined | null = null;

    service.getProduct(7).subscribe((p) => (categoria = p.categoria));
    expect(categoria).toBeNull(); // todavía no llegó la respuesta

    http.expectOne({ method: 'GET', url: `${api}/products/7` }).flush(apiProduct(7, null, 'Frutas'));

    expect(categoria).toBe('Frutas');
  });

  it('Given la API devuelve categoria: null, When se pide el producto, Then Product.categoria es undefined', () => {
    responderCargasIniciales();
    let recibido = false;
    let categoria: string | undefined | null = 'valor-inicial';

    service.getProduct(8).subscribe((p) => {
      recibido = true;
      categoria = p.categoria;
    });
    http.expectOne({ method: 'GET', url: `${api}/products/8` }).flush(apiProduct(8, null, null));

    expect(recibido).toBe(true);
    expect(categoria).toBeUndefined();
  });

  it('Given el mercado trae productos Lácteos, Verduras y sin categoría, When llega la carga, Then marketProducts() conserva el texto y deja undefined', () => {
    expect(service.marketProducts()).toEqual([]);

    http
      .expectOne((req) => req.url === `${api}/products` && !req.params.has('includeMine'))
      .flush([apiProduct(1, null, 'Lácteos'), apiProduct(2, null, 'Verduras'), apiProduct(3, null, null)]);
    responderCargasIniciales();

    expect(service.marketProducts().map((p) => p.categoria)).toEqual(['Lácteos', 'Verduras', undefined]);
  });
});
