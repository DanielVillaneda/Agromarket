import { Component, Input } from '@angular/core';
import { IonIcon } from '@ionic/angular';

export interface Product {
  id: number;
  title: string;
  price: string;
  location: string;
  icon: string;
  accent: string;
  description?: string;
  quantity?: string;
  photos?: string[];
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

  @Input({ required: true }) product!: Product;

}
