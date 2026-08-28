import { Component, inject } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { ProductsService } from '../../services/products.service';
import { addOutline, removeOutline, trashOutline} from 'ionicons/icons';

@Component({
  selector: 'app-carritocompras',
  templateUrl: './carritocompras.page.html',
  styleUrls: ['./carritocompras.page.scss'],
  imports: [IonContent, IonIcon, RouterLink],
})
export class CarritocomprasPage {

  addOutline = addOutline;
  removeOutline = removeOutline;
  trashOutline = trashOutline;

  private readonly productsService = inject(ProductsService);

  readonly items = this.productsService.cartItems;
  readonly total = this.productsService.cartTotal;

  checkedOut = false;

  increase(id: number, quantity: number): void {
    this.productsService.updateCartQuantity(id, quantity + 1);
  }

  decrease(id: number, quantity: number): void {
    this.productsService.updateCartQuantity(id, quantity - 1);
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

    this.items().forEach((item) => this.productsService.buyProduct(item.product.id));
    this.productsService.clearCart();
    this.checkedOut = true;
  }

}
