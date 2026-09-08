import { Component, inject } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { ProductsService } from '../../services/products.service';

@Component({
  selector: 'app-compras',
  templateUrl: './compras.page.html',
  styleUrls: ['./compras.page.scss'],
  imports: [IonContent, IonIcon, RouterLink, ProductCardComponent, NavbarComponent],
})
export class ComprasPage {

  private readonly productsService = inject(ProductsService);
  readonly products = this.productsService.purchasedProducts;

}
