import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import { ProductoVenderPage } from './producto-vender.page';
import { environment } from '../../../environments/environment';

const api = environment.apiUrl;
const ID = 42;

/** Producto propio con la forma real que devuelve GET /api/products/:id. */
function apiProduct(notas: string | null) {
  return {
    id: ID,
    title: 'Miel de abejas',
    price: 15000,
    location: 'Neiva',
    icon: 'leaf',
    accent: '#2e7d32',
    description: 'Miel pura de abejas del Huila',
    notas,
    quantity: 5,
    unit: 'litro',
    photos: ['data:image/png;base64,iVBORw0KGgo='],
    sellerId: 1,
    sellerName: 'Demo',
    sellerPhone: '3000000000',
    sellerEmail: 'demo@agromarket.co',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('ProductoVenderPage: notas al editar (CA3 y CA4)', () => {
  let component: ProductoVenderPage;
  let http: HttpTestingController;

  /** Abre la edición respondiendo el GET del producto con las notas indicadas. */
  function abrirEdicion(notas: string | null): void {
    const fixture = TestBed.createComponent(ProductoVenderPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    TestBed.tick();
    http.expectOne({ method: 'GET', url: `${api}/products/${ID}` }).flush(apiProduct(notas));
    http.match(() => true).forEach((req) => req.flush([]));
    fixture.detectChanges();
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

  it('Given un producto sin notas, When el dueño escribe notas y guarda, Then el PUT envía ese texto', () => {
    abrirEdicion(null);
    expect(component.form.value.notas).toBe(''); // null se precarga como campo vacío

    component.form.patchValue({ notas: 'Disponible solo los fines de semana' });
    component.onSave();

    const req = http.expectOne({ method: 'PUT', url: `${api}/products/${ID}` });
    expect(req.request.body.notas).toBe('Disponible solo los fines de semana');
  });

  it('Given un producto con notas, When se abre la edición, Then el campo notas viene precargado', () => {
    abrirEdicion('Se entrega en la plaza de mercado de Neiva');

    expect(component.form.value.notas).toBe('Se entrega en la plaza de mercado de Neiva');
  });

  it('Given un producto con notas, When el dueño vacía el campo y guarda, Then el PUT envía notas: null', () => {
    abrirEdicion('Se entrega en la plaza de mercado de Neiva');

    component.form.patchValue({ notas: '' });
    component.onSave();

    const req = http.expectOne({ method: 'PUT', url: `${api}/products/${ID}` });
    expect(req.request.body).toHaveProperty('notas', null);
  });
});
