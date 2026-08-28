import { Component, computed, inject, signal } from '@angular/core';
import { IonContent, IonIcon, IonToast } from '@ionic/angular';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductsService } from '../../services/products.service';

@Component({
  selector: 'app-producto',
  templateUrl: './producto.page.html',
  styleUrls: ['./producto.page.scss'],
  imports: [IonContent, IonIcon, RouterLink, IonToast],
})
export class ProductoPage {

  private readonly route = inject(ActivatedRoute);
  private readonly productsService = inject(ProductsService);

  private readonly id = Number(this.route.snapshot.paramMap.get('id'));

  readonly product = this.productsService.getMarketProduct(this.id);

  constructor() {
    if (this.product) {
      this.productsService.markViewed(this.id);
    }
  }

  readonly isFavorite = computed(() => this.productsService.isFavorite(this.id));

  readonly cartQuantity = computed(() => this.productsService.getCartQuantity(this.id));

  readonly showAddedToast = signal(false);

  toggleFavorite(): void {
    this.productsService.toggleFavorite(this.id);
  }

  addToCart(): void {
    this.productsService.addToCart(this.id);
    this.showAddedToast.set(true);
  }

  increaseCartQuantity(): void {
    this.productsService.updateCartQuantity(this.id, this.cartQuantity() + 1);
  }

  decreaseCartQuantity(): void {
    this.productsService.updateCartQuantity(this.id, this.cartQuantity() - 1);
  }

  removeFromCart(): void {
    this.productsService.removeFromCart(this.id);
  }

  dismissToast(): void {
    this.showAddedToast.set(false);
  }

}
