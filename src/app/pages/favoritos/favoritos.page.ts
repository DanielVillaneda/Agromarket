import { Component, inject } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { ProductsService } from '../../services/products.service';

@Component({
  selector: 'app-favoritos',
  templateUrl: './favoritos.page.html',
  styleUrls: ['./favoritos.page.scss'],
  imports: [IonContent, IonIcon, RouterLink, ProductCardComponent, NavbarComponent],
})
export class FavoritosPage {

  private readonly productsService = inject(ProductsService);
  readonly products = this.productsService.favoriteProducts;

}
