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

describe('ProductsService: searchProducts con rango de precio (spec 004)', () => {
  let service: ProductsService;
  let http: HttpTestingController;

  /** Producto con la forma real del backend, con título y precio propios. */
  function apiProductConPrecio(id: number, title: string, price: number) {
    return { ...apiProduct(id, null), title, price };
  }

  const MERCADO = [
    apiProductConPrecio(1, 'Café de Huila', 8000),
    apiProductConPrecio(2, 'Café orgánico', 15000),
    apiProductConPrecio(3, 'Café tostado', 30000),
    // No coincide por texto con "café", aunque su precio cae en todos los rangos probados
    apiProductConPrecio(4, 'Panela', 15000),
  ];

  beforeEach(() => {
    // Given: visitante sin sesión; el mercado y el buscador (includeMine=true) traen los mismos productos
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ProductsService);
    http = TestBed.inject(HttpTestingController);
    TestBed.tick();

    expect(service.searchProducts('café')).toEqual([]); // antes de la carga no hay nada
    http
      .match((req) => req.method === 'GET' && req.url === `${api}/products`)
      .forEach((req) => req.flush(MERCADO));
    http.match(() => true).forEach((req) => req.flush([]));
    expect(service.marketProducts().length).toBe(4);
  });

  afterEach(() => {
    http.verify();
  });

  function ids(rango?: { minimo: number | null; maximo: number | null }): number[] {
    return service.searchProducts('café', rango).map((p) => p.id);
  }

  it('Given productos "Café" de 8000, 15000 y 30000, When busca "café" sin rango, Then devuelve los 3', () => {
    expect(ids()).toEqual([1, 2, 3]);
  });

  it('Given la misma búsqueda, When el rango es {minimo: 15000, maximo: null}, Then devuelve 15000 y 30000 (mínimo inclusivo)', () => {
    expect(ids({ minimo: 15000, maximo: null })).toEqual([2, 3]);
  });

  it('Given la misma búsqueda, When el rango es {minimo: null, maximo: 15000}, Then devuelve 8000 y 15000 (máximo inclusivo)', () => {
    expect(ids({ minimo: null, maximo: 15000 })).toEqual([1, 2]);
  });

  it('Given la misma búsqueda, When el rango es {minimo: 10000, maximo: 15000}, Then devuelve solo el de 15000', () => {
    expect(ids({ minimo: 10000, maximo: 15000 })).toEqual([2]);
  });

  it('Given la misma búsqueda, When el rango es {minimo: 15000, maximo: 15000}, Then devuelve solo el de 15000 (ambos límites inclusivos)', () => {
    expect(ids({ minimo: 15000, maximo: 15000 })).toEqual([2]);
  });

  it('Given la misma búsqueda, When el rango es {minimo: null, maximo: null}, Then el resultado es igual al de sin rango', () => {
    expect(ids({ minimo: null, maximo: null })).toEqual(ids());
    expect(ids({ minimo: null, maximo: null })).toEqual([1, 2, 3]);
  });

  it('Given la misma búsqueda, When el máximo es 0, Then se aplica como límite real (no como "sin límite") y no devuelve nada', () => {
    // Caso límite: 0 es falsy; un "if (!maximo)" lo confundiría con null
    expect(ids({ minimo: null, maximo: 0 })).toEqual([]);
  });

  it('Given "Panela" a 15000, When se busca "café" con cualquier rango, Then nunca aparece', () => {
    const rangos = [
      undefined,
      { minimo: 15000, maximo: null },
      { minimo: null, maximo: 15000 },
      { minimo: 10000, maximo: 15000 },
      { minimo: null, maximo: null },
    ];
    for (const rango of rangos) {
      expect(ids(rango)).not.toContain(4);
    }
    // Control: "Panela" sí se encuentra cuando se busca por su nombre
    expect(service.searchProducts('panela', { minimo: 15000, maximo: 15000 }).map((p) => p.id)).toEqual([4]);
  });
});
