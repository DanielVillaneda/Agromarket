import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { Product, ProductCardComponent } from './product-card.component';
import { ProductsService } from '../../services/products.service';
import { environment } from '../../../environments/environment';

const api = environment.apiUrl;

/** Producto con la forma real que devuelve el backend (serializeProduct). */
function apiProduct(id: number, categoria: string | null) {
  return {
    id,
    title: 'Mango de azúcar',
    price: 4500,
    location: 'Neiva · Huila',
    icon: 'leaf-outline',
    accent: '#4caf50',
    description: 'Mango maduro recién cosechado',
    notas: null,
    categoria,
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

describe('ProductCardComponent: etiqueta de categoría (CA1 y CA4)', () => {
  let http: HttpTestingController;
  let service: ProductsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(ProductsService);
    TestBed.tick();
    // Cargas iniciales del ProductsService (mercado y buscador)
    http.match(() => true).forEach((req) => req.flush([]));
  });

  afterEach(() => {
    http.verify();
  });

  /** Pide el producto a la API simulada y renderiza su tarjeta con el Product ya mapeado. */
  function renderizarTarjeta(categoria: string | null): HTMLElement {
    let producto: Product | undefined;
    service.getProduct(5).subscribe((p) => (producto = p));
    http.expectOne({ method: 'GET', url: `${api}/products/5` }).flush(apiProduct(5, categoria));
    expect(producto).toBeDefined();

    const fixture = TestBed.createComponent(ProductCardComponent);
    fixture.componentInstance.product = producto!;
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('Given la API devuelve un producto con categoria "Frutas", When se renderiza su tarjeta, Then muestra .product-category con "Frutas"', () => {
    const tarjeta = renderizarTarjeta('Frutas');

    const etiqueta = tarjeta.querySelector('.product-category');
    expect(etiqueta).not.toBeNull();
    expect(etiqueta!.textContent!.trim()).toBe('Frutas');
    expect(tarjeta.querySelector('.product-title')?.textContent).toContain('Mango de azúcar');
  });

  it('Given la API devuelve un producto con categoria: null, When se renderiza su tarjeta, Then no hay .product-category', () => {
    const tarjeta = renderizarTarjeta(null);

    // La tarjeta sí se renderizó (tiene el título), pero sin etiqueta de categoría
    expect(tarjeta.textContent).toContain('Mango de azúcar');
    expect(tarjeta.querySelector('.product-category')).toBeNull();
  });
});
