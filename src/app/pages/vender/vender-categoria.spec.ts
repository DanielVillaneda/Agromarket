import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { VenderPage } from './vender.page';
import { environment } from '../../../environments/environment';

const api = environment.apiUrl;

describe('VenderPage: categoría al publicar (CA1 y CA4)', () => {
  let fixture: ComponentFixture<VenderPage>;
  let component: VenderPage;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(VenderPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    TestBed.tick();
    // Cargas iniciales del ProductsService (mercado y buscador)
    http.match(() => true).forEach((req) => req.flush([]));

    // Given: formulario completo con una foto
    component.form.patchValue({
      nombre: 'Mango de azúcar',
      precio: 4500,
      cantidad: 20,
      unidad: 'kilo',
      ubicacion: 'Neiva · Huila',
      descripcion: 'Mango maduro recién cosechado en la finca.',
    });
    component.images.set([{ id: 1, dataUrl: 'data:image/png;base64,iVBORw0KGgo=' }]);
  });

  afterEach(() => {
    http.verify();
  });

  function selectCategoria(): HTMLSelectElement {
    const select = (fixture.nativeElement as HTMLElement).querySelector<HTMLSelectElement>('#vender-categoria');
    expect(select).not.toBeNull();
    return select!;
  }

  it('Given el select ofrece "Sin categoría" y las cinco categorías, When se abre el formulario, Then el valor inicial es vacío', () => {
    const select = selectCategoria();
    const opciones = Array.from(select.options).map((o) => [o.value, o.textContent!.trim()]);

    expect(opciones).toEqual([
      ['', 'Sin categoría'],
      ['Frutas', 'Frutas'],
      ['Verduras', 'Verduras'],
      ['Granos', 'Granos'],
      ['Lácteos', 'Lácteos'],
      ['Otros', 'Otros'],
    ]);
    expect(select.value).toBe('');
  });

  it('Given el vendedor elige "Frutas" en el select, When publica, Then el POST envía categoria: "Frutas"', () => {
    const select = selectCategoria();
    select.value = 'Frutas';
    select.dispatchEvent(new Event('change'));

    component.onSubmit();

    const req = http.expectOne({ method: 'POST', url: `${api}/products` });
    expect(req.request.body.categoria).toBe('Frutas');
  });

  it('Given el vendedor elige "Lácteos" (con tilde), When publica, Then el POST envía exactamente "Lácteos"', () => {
    const select = selectCategoria();
    select.value = 'Lácteos';
    select.dispatchEvent(new Event('change'));

    component.onSubmit();

    const req = http.expectOne({ method: 'POST', url: `${api}/products` });
    // La API compara el texto exacto (NFC); otra forma de la tilde responde 400
    expect(req.request.body.categoria).toBe('L\u00e1cteos');
  });

  it('Given el vendedor deja "Sin categoría", When publica, Then el POST envía categoria: null', () => {
    // Primero elige una categoría y luego vuelve a "Sin categoría"
    const select = selectCategoria();
    select.value = 'Granos';
    select.dispatchEvent(new Event('change'));
    select.value = '';
    select.dispatchEvent(new Event('change'));

    component.onSubmit();

    const req = http.expectOne({ method: 'POST', url: `${api}/products` });
    expect(req.request.body).toHaveProperty('categoria', null);
  });
});
