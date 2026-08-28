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

  it('should add the product to the cart and show the confirmation toast', () => {
    expect(component.cartQuantity()).toBe(0);
    component.addToCart();
    expect(component.cartQuantity()).toBe(1);
    expect(component.showAddedToast()).toBeTruthy();
  });

  it('should step the cart quantity up and down', () => {
    component.addToCart();
    component.increaseCartQuantity();
    expect(component.cartQuantity()).toBe(2);
    component.decreaseCartQuantity();
    expect(component.cartQuantity()).toBe(1);
  });

  it('should remove the product from the cart', () => {
    component.addToCart();
    component.removeFromCart();
    expect(component.cartQuantity()).toBe(0);
  });
});
