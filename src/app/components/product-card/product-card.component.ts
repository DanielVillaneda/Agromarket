import { Component, Input, computed, inject } from '@angular/core';
import { IonIcon } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';

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

  @Input({ required: true }) product!: Product;

  readonly isMine = computed(() => {
    const userId = this.auth.currentUser()?.id;
    return userId !== undefined && userId === this.product.sellerId;
  });

}
