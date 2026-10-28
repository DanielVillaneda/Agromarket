import { Component, inject } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { ProductsService } from '../../services/products.service';

@Component({
  selector: 'app-compras',
  templateUrl: './compras.page.html',
  styleUrls: ['./compras.page.scss'],
  imports: [IonContent, IonIcon, RouterLink, NavbarComponent],
})
export class ComprasPage {

  private readonly productsService = inject(ProductsService);
  readonly purchases = this.productsService.purchaseHistory;

}
