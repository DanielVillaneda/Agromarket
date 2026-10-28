import { Component, inject } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { ProductsService } from '../../services/products.service';

@Component({
  selector: 'app-venta',
  templateUrl: './venta.page.html',
  styleUrls: ['./venta.page.scss'],
  imports: [IonContent, IonIcon, RouterLink, NavbarComponent],
})
export class VentaPage {

  private readonly productsService = inject(ProductsService);

  readonly products = this.productsService.myProducts;

}
