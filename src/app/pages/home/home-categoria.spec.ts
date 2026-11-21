import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { HomePage } from './home.page';
import { environment } from '../../../environments/environment';

const api = environment.apiUrl;

/** Producto con la forma real que devuelve el backend (serializeProduct). */
function apiProduct(id: number, title: string, categoria: string | null) {
  return {
    id,
    title,
    price: 4500,
    location: 'Neiva · Huila',
    icon: 'leaf-outline',
    accent: '#4caf50',
    description: 'Producto fresco de la región',
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

const TODOS = ['Mango', 'Fresa', 'Tomate', 'Panela sin categoría'];

describe('HomePage: filtro por categoría en "Lo más reciente" (CA2, CA3 y CA4)', () => {
  let fixture: ComponentFixture<HomePage>;
  let http: HttpTestingController;
  let root: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(HomePage);
    root = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
    TestBed.tick();

    // Given: el mercado trae dos Frutas, una Verdura y un producto sin categoría
    http
      .expectOne((req) => req.method === 'GET' && req.url === `${api}/products` && !req.params.has('includeMine') && !req.params.has('q'))
      .flush([
        apiProduct(1, 'Mango', 'Frutas'),
        apiProduct(2, 'Fresa', 'Frutas'),
        apiProduct(3, 'Tomate', 'Verduras'),
        apiProduct(4, 'Panela sin categoría', null),
      ]);
    // Resto de cargas iniciales (buscador, etc.)
    http.match(() => true).forEach((req) => req.flush([]));
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
  });

  /** Títulos de las tarjetas renderizadas en la grilla de "Lo más reciente". */
  function titulosEnGrilla(): string[] {
    return Array.from(root.querySelectorAll('.recent .product-grid app-product-card .product-title')).map((el) =>
      el.textContent!.replace('Mío', '').trim(),
    );
  }

  function chip(texto: string): HTMLButtonElement {
    const boton = Array.from(root.querySelectorAll<HTMLButtonElement>('.category-filter button.category-chip')).find(
      (b) => b.textContent!.trim() === texto,
    );
    expect(boton, `chip "${texto}"`).toBeDefined();
    return boton!;
  }

  function clic(texto: string): void {
    chip(texto).click();
    fixture.detectChanges();
  }

  function textoVacioCategoria(): boolean {
    return (root.querySelector('.recent')?.textContent ?? '').includes('No hay productos en esta categoría.');
  }

  it('Given el inicio recién cargado, Then "Todas" está activo y se ven los cuatro productos', () => {
    expect(chip('Todas').getAttribute('aria-pressed')).toBe('true');
    expect(chip('Frutas').getAttribute('aria-pressed')).toBe('false');
    expect(titulosEnGrilla()).toEqual(TODOS);
    expect(textoVacioCategoria()).toBe(false);
  });

  it('CA2: Given productos de varias categorías, When elige el chip "Frutas", Then solo se ven Mango y Fresa y ese chip tiene aria-pressed="true"', () => {
    expect(titulosEnGrilla()).toHaveLength(4);

    clic('Frutas');

    expect(titulosEnGrilla()).toEqual(['Mango', 'Fresa']);
    expect(chip('Frutas').getAttribute('aria-pressed')).toBe('true');
    expect(chip('Todas').getAttribute('aria-pressed')).toBe('false');
    expect(textoVacioCategoria()).toBe(false);
  });

  it('CA3: Given el inicio filtrado por "Frutas", When elige "Todas", Then vuelven los cuatro productos, con y sin categoría', () => {
    clic('Frutas');
    expect(titulosEnGrilla()).toEqual(['Mango', 'Fresa']);

    clic('Todas');

    expect(titulosEnGrilla()).toEqual(TODOS);
    expect(chip('Todas').getAttribute('aria-pressed')).toBe('true');
    expect(chip('Frutas').getAttribute('aria-pressed')).toBe('false');
  });

  it('CA4: Given un producto sin categoría, When recorre los cinco chips de categoría, Then no aparece en ninguno y sí en "Todas", sin etiqueta de categoría', () => {
    const sinCategoria = 'Panela sin categoría';
    const vistos: Record<string, string[]> = {};

    for (const categoria of ['Frutas', 'Verduras', 'Granos', 'Lácteos', 'Otros']) {
      clic(categoria);
      vistos[categoria] = titulosEnGrilla();
      expect(vistos[categoria], `en "${categoria}"`).not.toContain(sinCategoria);
    }
    // El recorrido sí filtró: cada chip mostró lo suyo
    expect(vistos).toEqual({ Frutas: ['Mango', 'Fresa'], Verduras: ['Tomate'], Granos: [], Lácteos: [], Otros: [] });

    clic('Todas');
    expect(titulosEnGrilla()).toContain(sinCategoria);

    // Su tarjeta no muestra categoría; las que tienen categoría sí la muestran
    const tarjetas = Array.from(root.querySelectorAll<HTMLElement>('.recent .product-grid app-product-card'));
    const tarjetaSin = tarjetas.find((t) => t.textContent!.includes(sinCategoria))!;
    const tarjetaMango = tarjetas.find((t) => t.textContent!.includes('Mango'))!;
    expect(tarjetaSin.querySelector('.product-category')).toBeNull();
    expect(tarjetaMango.querySelector('.product-category')?.textContent!.trim()).toBe('Frutas');
  });

  it('Given ningún producto es de "Granos", When elige "Granos", Then la grilla queda vacía y se ve "No hay productos en esta categoría."', () => {
    expect(textoVacioCategoria()).toBe(false);

    clic('Granos');

    expect(titulosEnGrilla()).toEqual([]);
    expect(textoVacioCategoria()).toBe(true);
    // No confunde este caso con el mercado vacío
    expect(root.querySelector('.recent')?.textContent).not.toContain('Aún no hay productos publicados.');
  });

  it('Given el filtro cambia, Then la región aria-live anuncia el conteo', () => {
    const region = root.querySelector('.recent [aria-live="polite"]')!;
    expect(region.textContent!.trim()).toBe('4 productos');

    clic('Verduras');
    expect(region.textContent!.replace(/\s+/g, ' ').trim()).toBe('1 producto en Verduras');
  });
});
