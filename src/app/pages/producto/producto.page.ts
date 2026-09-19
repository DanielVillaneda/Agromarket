import { Component, computed, inject, signal } from '@angular/core';
import { IonContent, IonIcon, IonToast } from '@ionic/angular';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductsService } from '../../services/products.service';
import { AuthService } from '../../services/auth.service';
import { Product } from '../../components/product-card/product-card.component';
import { NavbarComponent } from '../../components/navbar/navbar.component';

@Component({
  selector: 'app-producto',
  templateUrl: './producto.page.html',
  styleUrls: ['./producto.page.scss'],
  imports: [IonContent, IonIcon, RouterLink, IonToast, NavbarComponent],
})
export class ProductoPage {

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productsService = inject(ProductsService);
  private readonly auth = inject(AuthService);

  private readonly id = Number(this.route.snapshot.paramMap.get('id'));

  readonly product = signal<Product | null>(null);
  readonly loading = signal(true);

  readonly isFavorite = computed(() => {
    const product = this.product();
    return product ? this.productsService.isFavorite(product.id) : false;
  });

  readonly cartQuantity = computed(() => {
    const product = this.product();
    return product ? this.productsService.getCartQuantity(product.id) : 0;
  });

  readonly showAddedToast = signal(false);

  constructor() {
    this.productsService.getProduct(this.id).subscribe({
      next: (product) => {
        this.product.set(product);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  toggleFavorite(): void {
    if (!this.requireAuth()) {
      return;
    }

    this.productsService.toggleFavorite(this.id).subscribe();
  }

  addToCart(): void {
    if (!this.requireAuth()) {
      return;
    }

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

  private requireAuth(): boolean {
    if (this.auth.isAuthenticated()) {
      return true;
    }

    this.router.navigateByUrl('/login');
    return false;
  }

}
