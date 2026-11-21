import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import { ProductoPage } from './producto.page';
import { environment } from '../../../environments/environment';

const api = environment.apiUrl;
const ID = 28;

/** Producto con la forma real que devuelve GET /api/products/:id. */
function apiProduct(notas: string | null) {
  return {
    id: ID,
    title: 'Aguacate Hass',
    price: 8000,
    location: 'Neiva',
    icon: 'leaf',
    accent: '#2e7d32',
    description: 'Aguacate Hass de cosecha reciente',
    notas,
    quantity: 20,
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

describe('ProductoPage: sección Notas del vendedor (CA1 a CA4)', () => {
  let fixture: ComponentFixture<ProductoPage>;
  let http: HttpTestingController;

  /** Crea el detalle y responde el GET del producto con las notas indicadas. */
  function abrirDetalle(notas: string | null): HTMLElement {
    fixture = TestBed.createComponent(ProductoPage);
    fixture.detectChanges();
    TestBed.tick();

    http.expectOne({ method: 'GET', url: `${api}/products/${ID}` }).flush(apiProduct(notas));
    // Cargas del effect del servicio (mercado y buscador): no influyen en el detalle
    http.match(() => true).forEach((req) => req.flush([]));

    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  function titulosH2(el: HTMLElement): string[] {
    return Array.from(el.querySelectorAll('h2')).map((h) => h.textContent?.trim() ?? '');
  }

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
    http.verify();
  });

  it('Given el producto tiene notas, When se abre el detalle, Then se muestra la sección Notas del vendedor con ese texto', () => {
    const el = abrirDetalle('Disponible solo los fines de semana');

    // El detalle sí cargó, así que la presencia de la sección es significativa
    expect(titulosH2(el)).toContain('Descripción');

    const seccion = el.querySelector('section.producto-notas');
    expect(seccion).not.toBeNull();
    expect(seccion?.querySelector('h2')?.textContent?.trim()).toBe('Notas del vendedor');
    expect(seccion?.querySelector('.producto-notas-texto')?.textContent?.trim()).toBe(
      'Disponible solo los fines de semana',
    );
  });

  it('Given el producto tiene notas: null, When se abre el detalle, Then no aparece la sección Notas del vendedor', () => {
    const el = abrirDetalle(null);

    // El detalle cargó (hay descripción); solo falta la sección de notas
    expect(titulosH2(el)).toContain('Descripción');
    expect(el.querySelector('.producto-notas')).toBeNull();
    expect(titulosH2(el)).not.toContain('Notas del vendedor');
  });

  it('Given las notas contienen etiquetas HTML, When se abre el detalle, Then se muestran como texto plano sin interpretar', () => {
    const el = abrirDetalle('<b>Solo</b> fines de semana');

    const texto = el.querySelector('.producto-notas-texto');
    expect(texto?.textContent?.trim()).toBe('<b>Solo</b> fines de semana');
    expect(texto?.querySelector('b')).toBeNull();
  });
});
