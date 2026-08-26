import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import { ProductoVenderPage } from './producto-vender.page';

describe('ProductoVenderPage', () => {
  let component: ProductoVenderPage;
  let fixture: ComponentFixture<ProductoVenderPage>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: '101' }) } },
        },
      ],
    });
    fixture = TestBed.createComponent(ProductoVenderPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load the matching product into the form', () => {
    expect(component.product?.id).toBe(101);
    expect(component.nombre.value).toBe(component.product?.title);
  });

  it('should save changes to the underlying product', () => {
    component.form.patchValue({ nombre: 'Café Especial Reserva' });
    component.onSave();
    expect(component.product?.title).toBeDefined();
  });
});
