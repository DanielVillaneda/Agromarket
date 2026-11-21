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

describe('ProductsService: calificaciones del producto (spec 003)', () => {
  let service: ProductsService;
  let http: HttpTestingController;

  /** Producto con la forma real del backend, incluidos los campos de calificación. */
  function apiProductConRating(id: number, ratingAverage: number | null, ratingCount: number) {
    return { ...apiProduct(id, null), ratingAverage, ratingCount };
  }

  beforeEach(() => {
    // Given: visitante sin sesión; se responden las cargas iniciales del effect
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ProductsService);
    http = TestBed.inject(HttpTestingController);
    TestBed.tick();
    http.match(() => true).forEach((req) => req.flush([]));
  });

  afterEach(() => {
    http.verify();
  });

  it('Given la API devuelve ratingAverage 4.3 y ratingCount 12, When se pide el producto, Then Product los conserva', () => {
    let rating: { average?: number; count?: number } | null = null;

    service.getProduct(7).subscribe((p) => (rating = { average: p.ratingAverage, count: p.ratingCount }));
    expect(rating).toBeNull(); // todavía no llegó la respuesta

    http.expectOne({ method: 'GET', url: `${api}/products/7` }).flush(apiProductConRating(7, 4.3, 12));

    expect(rating).toEqual({ average: 4.3, count: 12 });
  });

  it('Given la API devuelve ratingAverage null y ratingCount 0, When se pide el producto, Then ratingAverage es undefined y ratingCount es 0', () => {
    let recibido = false;
    let average: number | undefined | null = -1;
    let count: number | undefined = -1;

    service.getProduct(8).subscribe((p) => {
      recibido = true;
      average = p.ratingAverage;
      count = p.ratingCount;
    });
    http.expectOne({ method: 'GET', url: `${api}/products/8` }).flush(apiProductConRating(8, null, 0));

    expect(recibido).toBe(true);
    expect(average).toBeUndefined();
    expect(count).toBe(0);
  });

  it('Given un producto de otro vendedor, When rateProduct(7, 4), Then hace POST /reviews/7 con {rating: 4} y devuelve el resumen de la API', () => {
    let resumen: unknown = null;

    service.rateProduct(7, 4).subscribe((r) => (resumen = r));
    const req = http.expectOne({ method: 'POST', url: `${api}/reviews/7` });
    expect(req.request.body).toEqual({ rating: 4 });
    expect(resumen).toBeNull();

    req.flush({ ratingAverage: 4, ratingCount: 1, myRating: 4 }, { status: 201, statusText: 'Created' });

    expect(resumen).toEqual({ ratingAverage: 4, ratingCount: 1, myRating: 4 });
  });

  it('Given el producto 9 tiene calificaciones, When getRatingSummary(9), Then hace GET /reviews/9 y devuelve el resumen con myRating', () => {
    let resumen: unknown = null;

    service.getRatingSummary(9).subscribe((r) => (resumen = r));
    const req = http.expectOne({ method: 'GET', url: `${api}/reviews/9` });
    req.flush({ ratingAverage: 4.5, ratingCount: 2, myRating: 5 });

    expect(resumen).toEqual({ ratingAverage: 4.5, ratingCount: 2, myRating: 5 });
  });

  it('Given la API responde 403 al calificar, When rateProduct(7, 5), Then el error llega con el mensaje de la API', () => {
    let mensaje: string | null = null;

    service.rateProduct(7, 5).subscribe({ error: (err) => (mensaje = err.error?.message ?? null) });
    http
      .expectOne({ method: 'POST', url: `${api}/reviews/7` })
      .flush({ message: 'No puedes calificar tu propio producto.' }, { status: 403, statusText: 'Forbidden' });

    expect(mensaje).toBe('No puedes calificar tu propio producto.');
  });
});
