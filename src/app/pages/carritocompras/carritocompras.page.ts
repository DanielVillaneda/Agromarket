import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { IonContent, IonIcon } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { PRODUCT_UNIT_LABELS, ProductsService, convertPrice, convertWeight } from '../../services/products.service';
import { Product } from '../../components/product-card/product-card.component';
import { addOutline, removeOutline, trashOutline} from 'ionicons/icons';
import { NavbarComponent } from '../../components/navbar/navbar.component';

interface CartItemView {
  product: Product;
  quantity: number;
  unit: string;
}

@Component({
  selector: 'app-carritocompras',
  templateUrl: './carritocompras.page.html',
  styleUrls: ['./carritocompras.page.scss'],
  imports: [IonContent, IonIcon, RouterLink, NavbarComponent],
})
export class CarritocomprasPage {

  addOutline = addOutline;
  removeOutline = removeOutline;
  trashOutline = trashOutline;

  private readonly productsService = inject(ProductsService);

  readonly items = this.productsService.cartItems;
  readonly total = this.productsService.cartTotal;

  checkedOut = false;
  readonly checkoutError = signal<string | null>(null);
  readonly itemError = signal<string | null>(null);

  maxForItem(item: CartItemView): number {
    const productUnit = item.product.unit ?? 'unidad';
    return convertWeight(item.product.rawQuantity ?? 0, productUnit, item.unit);
  }

  unitLabelForItem(item: CartItemView): string {
    return PRODUCT_UNIT_LABELS[item.unit as keyof typeof PRODUCT_UNIT_LABELS] ?? item.unit;
  }

  pricePerItemUnitLabel(item: CartItemView): string {
    const productUnit = item.product.unit ?? 'unidad';
    const price = Math.round(convertPrice(item.product.rawPrice ?? 0, productUnit, item.unit));
    return `${this.formatPrice(price)} por ${this.unitLabelForItem(item)}`;
  }

  increase(item: CartItemView): void {
    const max = this.maxForItem(item);

    if (item.quantity >= max) {
      this.itemError.set(
        `Solo hay ${Math.round(max * 100) / 100} ${this.unitLabelForItem(item)} disponibles de este producto.`,
      );
      return;
    }

    this.itemError.set(null);

    this.productsService.updateCartQuantity(item.product.id, item.quantity + 1).subscribe({
      error: (err: HttpErrorResponse) => {
        this.itemError.set(err.error?.message ?? 'No se pudo actualizar el carrito.');
      },
    });
  }

  decrease(id: number, quantity: number): void {
    this.productsService.updateCartQuantity(id, quantity - 1).subscribe();
  }

  remove(id: number): void {
    this.productsService.removeFromCart(id);
  }

  formatPrice(value: number): string {
    return `$${value.toLocaleString('es-CO')}`;
  }

  checkout(): void {
    if (!this.items().length) {
      return;
    }

    this.checkoutError.set(null);

    this.productsService.checkout().subscribe({
      next: () => {
        this.checkedOut = true;
      },
      error: (err: HttpErrorResponse) => {
        this.checkoutError.set(err.error?.message ?? 'No se pudo completar la compra. Intenta de nuevo.');
      },
    });
  }

}
