import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import { ProductoPage } from './producto.page';
import { AUTH_TOKEN_KEY } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

const api = environment.apiUrl;
const ID = 31;
const VENDEDOR_ID = 2;
const COMPRADOR_ID = 5;

/** Producto con la forma real que devuelve GET /api/products/:id (serializeProduct). */
function apiProduct(ratingAverage: number | null, ratingCount: number) {
  return {
    id: ID,
    title: 'Café especial',
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
    sellerName: 'Carlos',
    sellerPhone: '3000000000',
    sellerEmail: 'carlos.perez@agromarket.co',
    ratingAverage,
    ratingCount,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

/** Guarda en localStorage la sesión que AuthService lee al crearse. */
function iniciarSesion(id: number): void {
  localStorage.setItem(AUTH_TOKEN_KEY, 'token-de-prueba');
  localStorage.setItem(
    'agromarket_user',
    JSON.stringify({ id, nombre: 'Usuario', email: `u${id}@agromarket.co`, telefono: null, role: 'user' }),
  );
}

describe('ProductoPage: calificación de 1 a 5 estrellas (spec 003)', () => {
  let fixture: ComponentFixture<ProductoPage>;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: String(ID) }) } } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Si verify falla (petición sin atender), se reinicia igual el TestBed para
    // que el fallo no arrastre a las pruebas siguientes.
    try {
      http.verify();
    } finally {
      TestBed.resetTestingModule();
    }
  });

  /**
   * Crea el detalle, responde las cargas del effect del servicio (no influyen en
   * el detalle) y luego el GET del producto. La sesión debe fijarse antes.
   */
  function abrirDetalle(ratingAverage: number | null, ratingCount: number): HTMLElement {
    fixture = TestBed.createComponent(ProductoPage);
    fixture.detectChanges();
    TestBed.tick();

    http
      .match((req) => req.url !== `${api}/products/${ID}`)
      .forEach((req) => req.flush(req.request.url === `${api}/cart` ? { items: [], total: 0, count: 0 } : []));
    http.expectOne({ method: 'GET', url: `${api}/products/${ID}` }).flush(apiProduct(ratingAverage, ratingCount));

    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  /** Responde el GET /api/reviews/:id que la página pide con sesión. */
  function responderResumen(myRating: number | null, ratingAverage: number | null, ratingCount: number): void {
    http.expectOne({ method: 'GET', url: `${api}/reviews/${ID}` }).flush({ ratingAverage, ratingCount, myRating });
    fixture.detectChanges();
  }

  const texto = (el: HTMLElement, selector: string) => el.querySelector(selector)?.textContent?.trim() ?? null;
  const estrellas = (el: HTMLElement) =>
    Array.from(el.querySelectorAll<HTMLButtonElement>('.producto-estrellas[role=group] button.producto-estrella'));
  const pulsadas = (el: HTMLElement) =>
    estrellas(el)
      .map((b, i) => (b.getAttribute('aria-pressed') === 'true' ? i + 1 : null))
      .filter((n) => n !== null);
  const activas = (el: HTMLElement) =>
    estrellas(el)
      .map((b, i) => (b.classList.contains('producto-estrella--activa') ? i + 1 : null))
      .filter((n) => n !== null);

  describe('Resumen del promedio y la cantidad', () => {
    it('Given el producto tiene promedio 4.3 con 12 calificaciones, When se abre el detalle, Then muestra "4,3 de 5 · 12 calificaciones"', () => {
      const el = abrirDetalle(4.3, 12);
      expect(el.querySelector('.producto-rating-resumen .producto-rating-estrellas')?.getAttribute('aria-hidden')).toBe(
        'true',
      );
      expect(texto(el, '.producto-rating-resumen .producto-rating-texto')).toBe('4,3 de 5 · 12 calificaciones');
    });

    it('Given el producto tiene una sola calificación de 5, When se abre el detalle, Then muestra "5 de 5 · 1 calificación" en singular', () => {
      const el = abrirDetalle(5, 1);
      expect(texto(el, '.producto-rating-texto')).toBe('5 de 5 · 1 calificación');
    });

    it('Given el producto no tiene calificaciones (null y 0), When se abre el detalle, Then muestra "Aún sin calificaciones"', () => {
      const el = abrirDetalle(null, 0);
      expect(texto(el, '.producto-rating-texto')).toBe('Aún sin calificaciones');
    });
  });

  describe('Sin sesión', () => {
    it('Given un visitante sin sesión, When abre el detalle, Then ve el enlace para iniciar sesión, ninguna estrella y no se pide GET /reviews', () => {
      const el = abrirDetalle(4, 1);

      const seccion = el.querySelector('section.producto-calificar');
      expect(seccion?.querySelector('h2')?.textContent?.trim()).toBe('Califica este producto');
      expect(texto(el, 'a.producto-calificar-login')).toBe('Inicia sesión para calificar');
      expect(el.querySelectorAll('button.producto-estrella').length).toBe(0);
      http.expectNone(`${api}/reviews/${ID}`);
    });
  });

  describe('Con sesión de un comprador (otro usuario)', () => {
    beforeEach(() => iniciarSesion(COMPRADOR_ID));

    it('Given el comprador ya calificó con 3, When abre el detalle, Then hay 5 estrellas con su aria-label, solo la 3 está pulsada y dice "Tu calificación: 3 de 5"', () => {
      const el = abrirDetalle(3, 1);
      // Antes de la respuesta de GET /reviews no hay ninguna estrella marcada
      expect(pulsadas(el)).toEqual([]);

      responderResumen(3, 3, 1);

      expect(el.querySelector('a.producto-calificar-login')).toBeNull();
      expect(estrellas(el).map((b) => b.getAttribute('aria-label'))).toEqual([
        'Calificar con 1 de 5 estrellas',
        'Calificar con 2 de 5 estrellas',
        'Calificar con 3 de 5 estrellas',
        'Calificar con 4 de 5 estrellas',
        'Calificar con 5 de 5 estrellas',
      ]);
      expect(pulsadas(el)).toEqual([3]);
      expect(activas(el)).toEqual([1, 2, 3]);
      expect(texto(el, 'p.producto-calificar-actual')).toBe('Tu calificación: 3 de 5');
    });

    it('CA1: Given un producto sin calificaciones, When el comprador pulsa la estrella 4, Then hace POST {rating: 4}, el resumen pasa a "4 de 5 · 1 calificación" y agradece', () => {
      const el = abrirDetalle(null, 0);
      responderResumen(null, null, 0);
      expect(texto(el, '.producto-rating-texto')).toBe('Aún sin calificaciones');
      expect(el.querySelector('p.producto-calificar-actual')).toBeNull();

      estrellas(el)[3].click();
      fixture.detectChanges();
      const post = http.expectOne({ method: 'POST', url: `${api}/reviews/${ID}` });
      expect(post.request.body).toEqual({ rating: 4 });
      post.flush({ ratingAverage: 4, ratingCount: 1, myRating: 4 }, { status: 201, statusText: 'Created' });
      fixture.detectChanges();

      expect(texto(el, '.producto-rating-texto')).toBe('4 de 5 · 1 calificación');
      expect(pulsadas(el)).toEqual([4]);
      expect(activas(el)).toEqual([1, 2, 3, 4]);
      expect(texto(el, 'p.producto-calificar-actual')).toBe('Tu calificación: 4 de 5');
      expect(texto(el, '.producto-calificar-estado[role=status] p.producto-calificar-ok')).toBe(
        '¡Gracias por tu calificación!',
      );
    });

    it('CA2: Given el comprador ya calificó con 4 (única calificación), When recalifica con 2, Then hace POST {rating: 2} y el conteo sigue en 1', () => {
      const el = abrirDetalle(4, 1);
      responderResumen(4, 4, 1);
      expect(texto(el, '.producto-rating-texto')).toBe('4 de 5 · 1 calificación');

      estrellas(el)[1].click();
      const post = http.expectOne({ method: 'POST', url: `${api}/reviews/${ID}` });
      expect(post.request.body).toEqual({ rating: 2 });
      post.flush({ ratingAverage: 2, ratingCount: 1, myRating: 2 });
      fixture.detectChanges();

      expect(texto(el, '.producto-rating-texto')).toBe('2 de 5 · 1 calificación');
      expect(pulsadas(el)).toEqual([2]);
      expect(texto(el, 'p.producto-calificar-actual')).toBe('Tu calificación: 2 de 5');
    });

    it('CA3: Given promedio 4.5 con 2 calificaciones, When el comprador califica con 3, Then el resumen usa la respuesta: "4 de 5 · 3 calificaciones"', () => {
      const el = abrirDetalle(4.5, 2);
      responderResumen(null, 4.5, 2);
      expect(texto(el, '.producto-rating-texto')).toBe('4,5 de 5 · 2 calificaciones');

      estrellas(el)[2].click();
      http
        .expectOne({ method: 'POST', url: `${api}/reviews/${ID}` })
        .flush({ ratingAverage: 4, ratingCount: 3, myRating: 3 }, { status: 201, statusText: 'Created' });
      fixture.detectChanges();

      expect(texto(el, '.producto-rating-texto')).toBe('4 de 5 · 3 calificaciones');
    });

    it('Given un POST en curso, When el comprador pulsa otra estrella, Then los botones tienen aria-disabled="true" y no se envía un segundo POST', () => {
      const el = abrirDetalle(null, 0);
      responderResumen(null, null, 0);
      expect(estrellas(el)[0].getAttribute('aria-disabled')).not.toBe('true');

      estrellas(el)[4].click();
      fixture.detectChanges();
      const post = http.expectOne({ method: 'POST', url: `${api}/reviews/${ID}` });
      expect(estrellas(el).every((b) => b.getAttribute('aria-disabled') === 'true')).toBe(true);

      estrellas(el)[0].click();
      http.expectNone({ method: 'POST', url: `${api}/reviews/${ID}` });

      post.flush({ ratingAverage: 5, ratingCount: 1, myRating: 5 }, { status: 201, statusText: 'Created' });
      fixture.detectChanges();
      expect(estrellas(el)[0].getAttribute('aria-disabled')).not.toBe('true');
      expect(pulsadas(el)).toEqual([5]);
    });

    it('Given la API responde 403, When el comprador califica, Then se muestra el mensaje de la API y el resumen no cambia', () => {
      const el = abrirDetalle(4, 1);
      responderResumen(null, 4, 1);

      estrellas(el)[4].click();
      http
        .expectOne({ method: 'POST', url: `${api}/reviews/${ID}` })
        .flush({ message: 'No puedes calificar tu propio producto.' }, { status: 403, statusText: 'Forbidden' });
      fixture.detectChanges();

      expect(texto(el, '.producto-calificar-estado[role=status] p.producto-cart-error')).toBe(
        'No puedes calificar tu propio producto.',
      );
      expect(el.querySelector('p.producto-calificar-ok')).toBeNull();
      expect(texto(el, '.producto-rating-texto')).toBe('4 de 5 · 1 calificación');
      expect(pulsadas(el)).toEqual([]);
    });

    it('Given la API responde 400, When el comprador califica, Then se muestra el mensaje de la API', () => {
      const el = abrirDetalle(null, 0);
      responderResumen(null, null, 0);

      estrellas(el)[0].click();
      http.expectOne({ method: 'POST', url: `${api}/reviews/${ID}` }).flush(
        {
          message: 'Datos inválidos.',
          errors: [{ path: 'rating', message: 'La calificación debe ser un número entero de 1 a 5.' }],
        },
        { status: 400, statusText: 'Bad Request' },
      );
      fixture.detectChanges();

      expect(texto(el, 'p.producto-cart-error')).toBe('Datos inválidos.');
      expect(texto(el, '.producto-rating-texto')).toBe('Aún sin calificaciones');
    });

    it('Given una calificación anterior falló, When vuelve a calificar con éxito, Then el error desaparece y aparece el agradecimiento', () => {
      const el = abrirDetalle(null, 0);
      responderResumen(null, null, 0);

      estrellas(el)[0].click();
      http
        .expectOne({ method: 'POST', url: `${api}/reviews/${ID}` })
        .flush({ message: 'Error temporal.' }, { status: 500, statusText: 'Server Error' });
      fixture.detectChanges();
      expect(texto(el, 'p.producto-cart-error')).toBe('Error temporal.');

      estrellas(el)[0].click();
      http
        .expectOne({ method: 'POST', url: `${api}/reviews/${ID}` })
        .flush({ ratingAverage: 1, ratingCount: 1, myRating: 1 }, { status: 201, statusText: 'Created' });
      fixture.detectChanges();

      expect(el.querySelector('p.producto-cart-error')).toBeNull();
      expect(texto(el, 'p.producto-calificar-ok')).toBe('¡Gracias por tu calificación!');
    });
  });

  describe('CA4: con sesión del vendedor', () => {
    beforeEach(() => iniciarSesion(VENDEDOR_ID));

    it('Given el vendedor (currentUser.id === sellerId), When abre el detalle de su producto, Then no aparece la sección para calificar y no se pide GET /reviews', () => {
      const el = abrirDetalle(4, 1);

      // El detalle cargó: el resumen sí se muestra
      expect(texto(el, '.producto-rating-texto')).toBe('4 de 5 · 1 calificación');
      expect(el.querySelector('section.producto-calificar')).toBeNull();
      expect(el.querySelectorAll('button.producto-estrella').length).toBe(0);
      expect(el.querySelector('a.producto-calificar-login')).toBeNull();
      http.expectNone(`${api}/reviews/${ID}`);
    });
  });
});
