import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { SearchPage } from './search.page';
import { environment } from '../../../environments/environment';

const api = environment.apiUrl;

/** Producto con la forma real que devuelve el backend (serializeProduct). */
function apiProduct(id: number, title: string, price: number) {
  return {
    id,
    title,
    price,
    location: 'Neiva · Huila',
    icon: 'leaf-outline',
    accent: '#4caf50',
    description: 'Producto fresco de la región',
    notas: null,
    categoria: null,
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

// Given común: tres productos "Café" con precios de 8.000, 15.000 y 30.000, y uno que no coincide por texto
const MERCADO = [
  apiProduct(1, 'Café de Huila', 8000),
  apiProduct(2, 'Café orgánico', 15000),
  apiProduct(3, 'Café tostado', 30000),
  apiProduct(4, 'Panela', 15000),
];

const MENSAJE_RANGO = 'El precio mínimo no puede ser mayor que el máximo.';

describe('SearchPage: filtro por precio en /search (spec 004, CA1 a CA4)', () => {
  let harness: RouterTestingHarness;
  let http: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'search', component: SearchPage }]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create();
    // When: el comprador busca "café" (misma tilde que los datos simulados)
    await harness.navigateByUrl('/search?q=café', SearchPage);
    TestBed.tick();

    // Cargas iniciales del servicio: mercado y buscador (includeMine=true) traen los productos
    http
      .match((req) => req.method === 'GET' && req.url === `${api}/products`)
      .forEach((req) => req.flush(MERCADO));
    http.match(() => true).forEach((req) => req.flush([]));
    harness.detectChanges();
  });

  afterEach(() => {
    http.verify();
  });

  const raiz = (): HTMLElement => harness.routeNativeElement as HTMLElement;
  const q = <T extends Element = HTMLElement>(sel: string): T | null => raiz().querySelector<T>(sel);
  const inputMinimo = (): HTMLInputElement => q<HTMLInputElement>('#search-precio-minimo')!;
  const inputMaximo = (): HTMLInputElement => q<HTMLInputElement>('#search-precio-maximo')!;
  const textoLimpio = (el: Element | null): string => (el?.textContent ?? '').replace(/\s+/g, ' ').trim();

  /** Escribe en un campo como lo haría el usuario: cambia value y dispara un evento input real. */
  function escribir(input: HTMLInputElement, valor: string): void {
    input.value = valor;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    harness.detectChanges();
  }

  /** Títulos de las tarjetas que se ven en la grilla de resultados. */
  function titulos(): string[] {
    return Array.from(raiz().querySelectorAll('.product-link app-product-card .product-title')).map((el) =>
      textoLimpio(el),
    );
  }

  const botonQuitar = (): HTMLButtonElement | null => q<HTMLButtonElement>('button.search-precio-limpiar');
  const alerta = (): HTMLElement => q('#search-precio-error')!;
  const contador = (): string => textoLimpio(q('.search-count'));
  const regionViva = (): string => textoLimpio(q('.sr-only[aria-live="polite"]'));
  const mensajeVacio = (): string => textoLimpio(q('.search-empty p'));

  it('CA1: Given búsqueda "café", When deja vacíos mínimo y máximo, Then se ven las 3 tarjetas, sin mensaje de error ni botón de quitar', () => {
    expect(inputMinimo().value).toBe('');
    expect(inputMaximo().value).toBe('');
    expect(titulos()).toEqual(['Café de Huila', 'Café orgánico', 'Café tostado']);
    expect(contador()).toBe('(3)');
    expect(textoLimpio(alerta())).toBe('');
    expect(botonQuitar()).toBeNull();
  });

  it('CA2: Given búsqueda "café", When escribe 15000 como mínimo, Then quedan las tarjetas de 15000 y 30000 y el contador muestra (2)', () => {
    expect(titulos().length).toBe(3);

    escribir(inputMinimo(), '15000');

    expect(titulos()).toEqual(['Café orgánico', 'Café tostado']);
    expect(titulos()).not.toContain('Café de Huila');
    expect(contador()).toBe('(2)');
    expect(botonQuitar()).not.toBeNull();
  });

  it('CA3: Given búsqueda "café", When escribe 15000 como máximo, Then quedan 8000 y 15000; y al agregar mínimo 10000 solo queda 15000', () => {
    escribir(inputMaximo(), '15000');
    expect(titulos()).toEqual(['Café de Huila', 'Café orgánico']);
    expect(titulos()).not.toContain('Café tostado');

    escribir(inputMinimo(), '10000');
    expect(titulos()).toEqual(['Café orgánico']);
    expect(contador()).toBe('(1)');
  });

  it('CA4: Given búsqueda "café", When escribe mínimo 20000 y máximo 10000, Then se anuncia el mensaje, no se filtra y los campos quedan marcados; al corregir desaparece', () => {
    expect(alerta().getAttribute('role')).toBe('alert');
    expect(textoLimpio(alerta())).toBe('');

    escribir(inputMinimo(), '20000');
    escribir(inputMaximo(), '10000');

    // Mensaje exacto dentro de la región role=alert
    expect(textoLimpio(raiz().querySelector('[role="alert"]'))).toBe(MENSAJE_RANGO);
    // El filtro no se aplica: se siguen viendo los tres productos
    expect(titulos()).toEqual(['Café de Huila', 'Café orgánico', 'Café tostado']);
    expect(contador()).toBe('(3)');
    for (const input of [inputMinimo(), inputMaximo()]) {
      expect(input.getAttribute('aria-invalid')).toBe('true');
      expect(input.getAttribute('aria-describedby')).toBe('search-precio-error');
    }

    // Al corregir el rango (máximo 30000) se aplica el filtro y se quita el aviso
    escribir(inputMaximo(), '30000');
    expect(textoLimpio(alerta())).toBe('');
    expect(titulos()).toEqual(['Café tostado']);
    for (const input of [inputMinimo(), inputMaximo()]) {
      expect(input.hasAttribute('aria-invalid')).toBe(false);
      expect(input.hasAttribute('aria-describedby')).toBe(false);
    }
  });

  it('Given búsqueda "café", When el rango no deja ningún producto, Then aparece el mensaje de rango vacío y no el de texto sin resultados', () => {
    escribir(inputMinimo(), '40000');

    expect(titulos()).toEqual([]);
    expect(mensajeVacio()).toBe('No hay productos para "café" en ese rango de precio.');
    expect(q('.search-count')).toBeNull();
    // El fieldset sigue visible para poder corregir el rango
    expect(q('fieldset.search-precio')).not.toBeNull();
  });

  it('Given una búsqueda sin coincidencias por texto, When no hay filtro de precio, Then aparece el mensaje original', async () => {
    await harness.navigateByUrl('/search?q=zanahoria');
    harness.detectChanges();

    expect(titulos()).toEqual([]);
    expect(mensajeVacio()).toBe('No encontramos productos para "zanahoria".');
  });

  it('Given una búsqueda sin coincidencias por texto, When además hay un rango, Then sigue mostrando el mensaje de texto sin resultados', async () => {
    escribir(inputMinimo(), '1000');
    await harness.navigateByUrl('/search?q=zanahoria');
    harness.detectChanges();

    expect(mensajeVacio()).toBe('No encontramos productos para "zanahoria".');
  });

  it('Given un filtro de precio aplicado, When pulsa "Quitar filtro de precio", Then los campos quedan vacíos, vuelven las 3 tarjetas, el botón desaparece y el foco va al mínimo', () => {
    escribir(inputMinimo(), '10000');
    escribir(inputMaximo(), '15000');
    expect(titulos().length).toBe(1);
    expect(textoLimpio(botonQuitar())).toBe('Quitar filtro de precio');

    botonQuitar()!.focus();
    botonQuitar()!.click();
    harness.detectChanges();

    expect(inputMinimo().value).toBe('');
    expect(inputMaximo().value).toBe('');
    expect(titulos()).toEqual(['Café de Huila', 'Café orgánico', 'Café tostado']);
    expect(botonQuitar()).toBeNull();
    expect(document.activeElement).toBe(inputMinimo());
  });

  it('Given el formulario de precio, Then cada campo tiene un <label for> que apunta a su id', () => {
    const labelMin = q<HTMLLabelElement>('label[for="search-precio-minimo"]');
    const labelMax = q<HTMLLabelElement>('label[for="search-precio-maximo"]');
    expect(textoLimpio(labelMin)).toBe('Precio mínimo (COP)');
    expect(textoLimpio(labelMax)).toBe('Precio máximo (COP)');
    expect(inputMinimo().labels?.[0]).toBe(labelMin);
    expect(inputMaximo().labels?.[0]).toBe(labelMax);
    expect(textoLimpio(q('fieldset.search-precio legend'))).toBe('Filtrar por precio');
  });

  it('Given búsqueda "café", When cambia el rango, Then la región aria-live anuncia "3 resultados", "1 resultado", "Sin resultados" y "2 resultados"', () => {
    expect(regionViva()).toBe('3 resultados');

    escribir(inputMinimo(), '30000');
    expect(regionViva()).toBe('1 resultado');

    escribir(inputMinimo(), '30001');
    expect(regionViva()).toBe('Sin resultados');

    escribir(inputMinimo(), '15000');
    expect(regionViva()).toBe('2 resultados');
  });

  it('Given un mínimo aplicado, When borra el campo, Then se trata como sin límite y el botón de quitar desaparece', () => {
    escribir(inputMinimo(), '15000');
    expect(titulos().length).toBe(2);

    escribir(inputMinimo(), '');
    expect(titulos().length).toBe(3);
    expect(botonQuitar()).toBeNull();
  });
});
