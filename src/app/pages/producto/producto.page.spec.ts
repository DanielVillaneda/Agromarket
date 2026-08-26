import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import { ProductoPage } from './producto.page';

describe('ProductoPage', () => {
  let component: ProductoPage;
  let fixture: ComponentFixture<ProductoPage>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: '1' }) } },
        },
      ],
    });
    fixture = TestBed.createComponent(ProductoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load the matching product', () => {
    expect(component.product?.id).toBe(1);
  });

  it('should toggle favorite state', () => {
    expect(component.isFavorite()).toBeFalsy();
    component.toggleFavorite();
    expect(component.isFavorite()).toBeTruthy();
  });

  it('should mark the product as purchased', () => {
    expect(component.isPurchased()).toBeFalsy();
    component.buyProduct();
    expect(component.isPurchased()).toBeTruthy();
  });
});
