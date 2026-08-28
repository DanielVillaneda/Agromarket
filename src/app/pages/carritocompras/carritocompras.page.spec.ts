import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { CarritocomprasPage } from './carritocompras.page';
import { ProductsService } from '../../services/products.service';

describe('CarritocomprasPage', () => {
  let component: CarritocomprasPage;
  let fixture: ComponentFixture<CarritocomprasPage>;
  let productsService: ProductsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });
    fixture = TestBed.createComponent(CarritocomprasPage);
    component = fixture.componentInstance;
    productsService = TestBed.inject(ProductsService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with an empty cart', () => {
    expect(component.items().length).toBe(0);
  });

  it('should reflect items added to the cart', () => {
    productsService.addToCart(1, 2);
    expect(component.items().length).toBe(1);
    expect(component.items()[0].quantity).toBe(2);
  });

  it('should clear the cart and mark products as purchased on checkout', () => {
    productsService.addToCart(1);
    component.checkout();
    expect(component.items().length).toBe(0);
    expect(component.checkedOut).toBeTruthy();
    expect(productsService.isPurchased(1)).toBeTruthy();
  });
});
