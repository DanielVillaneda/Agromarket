import { Component, inject } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { ProductsService } from '../../services/products.service';

@Component({
  selector: 'app-venta',
  templateUrl: './venta.page.html',
  styleUrls: ['./venta.page.scss'],
  imports: [IonContent, IonIcon, RouterLink, ProductCardComponent],
})
export class VentaPage {

  private readonly productsService = inject(ProductsService);

  readonly products = this.productsService.myProducts;

}
