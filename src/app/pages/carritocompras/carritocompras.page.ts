import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { IonContent, IonIcon } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { ProductsService } from '../../services/products.service';
import { addOutline, removeOutline, trashOutline} from 'ionicons/icons';
import { NavbarComponent } from '../../components/navbar/navbar.component';

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
