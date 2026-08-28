import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { ProductsService } from '../../services/products.service';
import { searchOutline } from 'ionicons/icons';

@Component({
  selector: 'app-search',
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
  imports: [IonContent, IonIcon, RouterLink, ProductCardComponent],
})
export class SearchPage {

  searchOutline = searchOutline;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productsService = inject(ProductsService);

  /**
   * Se lee de forma reactiva (no snapshot) para que, si el usuario vuelve a
   * buscar desde la barra de navegación estando ya en esta página, los
   * resultados se actualicen sin necesidad de recargar el componente.
   */
  private readonly queryParamMap = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  readonly query = computed(() => this.queryParamMap().get('q')?.trim() ?? '');

  readonly results = computed(() => this.productsService.searchProducts(this.query()));

  readonly topSearches = this.productsService.topSearches;

  searchTerm(term: string): void {
    this.router.navigate(['/search'], { queryParams: { q: term } });
  }

}
