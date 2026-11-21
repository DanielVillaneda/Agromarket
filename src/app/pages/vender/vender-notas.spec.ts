import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { VenderPage } from './vender.page';
import { environment } from '../../../environments/environment';

const api = environment.apiUrl;

describe('VenderPage: notas al publicar (CA1 y CA2)', () => {
  let component: VenderPage;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(VenderPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    TestBed.tick();
    // Cargas iniciales del ProductsService (mercado y buscador)
    http.match(() => true).forEach((req) => req.flush([]));

    // Given: formulario completo con una foto
    component.form.patchValue({
      nombre: 'Café Especial',
      precio: 20000,
      cantidad: 10,
      unidad: 'kilo',
      ubicacion: 'Neiva · Huila',
      descripcion: 'Café cultivado en las montañas del Huila, tueste medio.',
    });
    component.images.set([{ id: 1, dataUrl: 'data:image/png;base64,iVBORw0KGgo=' }]);
  });

  afterEach(() => {
    http.verify();
  });

  it('Given el vendedor escribe notas con espacios, When publica, Then el POST envía las notas sin espacios', () => {
    component.form.patchValue({ notas: '  Disponible solo los fines de semana  ' });

    component.onSubmit();

    const req = http.expectOne({ method: 'POST', url: `${api}/products` });
    expect(req.request.body.notas).toBe('Disponible solo los fines de semana');
  });

  it('Given el vendedor deja las notas vacías, When publica, Then el POST envía notas: null', () => {
    component.form.patchValue({ notas: '   ' });

    component.onSubmit();

    const req = http.expectOne({ method: 'POST', url: `${api}/products` });
    expect(req.request.body.notas).toBeNull();
  });

  it('Given notas de 501 caracteres, When publica, Then el formulario es inválido y no se envía nada', () => {
    component.form.patchValue({ notas: 'a'.repeat(500) });
    expect(component.form.valid).toBe(true); // 500 es el máximo permitido

    component.form.patchValue({ notas: 'a'.repeat(501) });
    expect(component.form.valid).toBe(false);

    component.onSubmit();
    http.expectNone({ method: 'POST', url: `${api}/products` });
  });
});
