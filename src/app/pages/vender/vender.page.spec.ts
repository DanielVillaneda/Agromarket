import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { VenderPage } from './vender.page';

describe('VenderPage', () => {
  let component: VenderPage;
  let fixture: ComponentFixture<VenderPage>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });
    fixture = TestBed.createComponent(VenderPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should be invalid when empty', () => {
    expect(component.form.valid).toBeFalsy();
  });

  it('should be valid with complete data', () => {
    component.form.setValue({
      nombre: 'Café Especial',
      precio: 20000,
      cantidad: 10,
      ubicacion: 'Neiva · Huila',
      descripcion: 'Café cultivado en las montañas del Huila, tueste medio.',
    });
    expect(component.form.valid).toBeTruthy();
  });
});
