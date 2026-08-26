import { Component, computed, inject } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductsService } from '../../services/products.service';

@Component({
  selector: 'app-producto',
  templateUrl: './producto.page.html',
  styleUrls: ['./producto.page.scss'],
  imports: [IonContent, IonIcon, RouterLink],
})
export class ProductoPage {

  private readonly route = inject(ActivatedRoute);
  private readonly productsService = inject(ProductsService);

  private readonly id = Number(this.route.snapshot.paramMap.get('id'));

  readonly product = this.productsService.getMarketProduct(this.id);

  readonly isFavorite = computed(() => this.productsService.isFavorite(this.id));

  readonly isPurchased = computed(() => this.productsService.isPurchased(this.id));

  toggleFavorite(): void {
    this.productsService.toggleFavorite(this.id);
  }

  buyProduct(): void {
    this.productsService.buyProduct(this.id);
  }

}
