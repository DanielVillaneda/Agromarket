import { Component, Input, computed, inject } from '@angular/core';
import { IonIcon } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ProductsService } from '../../services/products.service';

export interface Product {
  id: number;
  title: string;
  price: string;
  rawPrice?: number;
  location: string;
  icon: string;
  accent: string;
  description?: string;
  quantity?: string;
  rawQuantity?: number;
  unit?: string;
  photos?: string[];
  sellerId?: number;
  sellerName?: string;
  sellerPhone?: string;
  sellerEmail?: string;
}

@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss'],
  imports: [IonIcon],
})
export class ProductCardComponent {

  private readonly auth = inject(AuthService);
  private readonly productsService = inject(ProductsService);
  private readonly router = inject(Router);

  @Input({ required: true }) product!: Product;

  readonly isMine = computed(() => {
    const userId = this.auth.currentUser()?.id;
    return userId !== undefined && userId === this.product.sellerId;
  });

  isFavorite(): boolean {
    return this.productsService.isFavorite(this.product.id);
  }

  /**
   * El corazón está dentro del enlace de la tarjeta: se cancela la
   * navegación para que marcar favorito no abra el producto.
   */
  onFavoriteClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (!this.auth.isAuthenticated()) {
      this.router.navigateByUrl('/login');
      return;
    }

    this.productsService.toggleFavorite(this.product.id, this.product).subscribe();
  }

  /** "kilo", "libra"... para mostrar el precio como "$1.000 / kilo". */
  get unitLabel(): string {
    return this.product.unit ?? 'unidad';
  }

}
