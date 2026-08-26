import { Component, inject } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { ProductsService } from '../../services/products.service';

@Component({
  selector: 'app-favoritos',
  templateUrl: './favoritos.page.html',
  styleUrls: ['./favoritos.page.scss'],
  imports: [IonContent, IonIcon, RouterLink, ProductCardComponent],
})
export class FavoritosPage {

  private readonly productsService = inject(ProductsService);
  readonly products = this.productsService.favoriteProducts;

}
