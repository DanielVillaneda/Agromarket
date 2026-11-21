import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { ProductsService } from '../../services/products.service';
import { searchOutline } from 'ionicons/icons';

@Component({
  selector: 'app-search',
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
  imports: [IonContent, IonIcon, RouterLink, ProductCardComponent, NavbarComponent],
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

  readonly precioMinimo = signal<number | null>(null);
  readonly precioMaximo = signal<number | null>(null);

  readonly rangoInvalido = computed(() => {
    const minimo = this.precioMinimo();
    const maximo = this.precioMaximo();
    return minimo !== null && maximo !== null && minimo > maximo;
  });

  readonly hayFiltroPrecio = computed(
    () => this.precioMinimo() !== null || this.precioMaximo() !== null,
  );

  /** Resultados solo por texto, sin rango de precio. */
  readonly resultadosPorTexto = computed(() => this.productsService.searchProducts(this.query()));

  /** Con el rango inválido se ignora el filtro y se ven todos los del texto. */
  readonly results = computed(() =>
    this.productsService.searchProducts(
      this.query(),
      this.rangoInvalido()
        ? undefined
        : { minimo: this.precioMinimo(), maximo: this.precioMaximo() },
    ),
  );

  private convertirPrecio(valor: string): number | null {
    if (valor.trim() === '') {
      return null;
    }
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : null;
  }

  actualizarPrecioMinimo(valor: string): void {
    this.precioMinimo.set(this.convertirPrecio(valor));
  }

  actualizarPrecioMaximo(valor: string): void {
    this.precioMaximo.set(this.convertirPrecio(valor));
  }

  private readonly precioMinimoInput = viewChild<ElementRef<HTMLInputElement>>('precioMinimoInput');

  quitarFiltroPrecio(): void {
    // El botón sale del DOM al limpiar: se mueve el foco al primer campo antes,
    // para que el usuario de teclado no pierda su posición (WCAG 2.4.3).
    this.precioMinimoInput()?.nativeElement.focus();
    this.precioMinimo.set(null);
    this.precioMaximo.set(null);
  }

  readonly topSearches = this.productsService.topSearches;

  searchTerm(term: string): void {
    this.router.navigate(['/search'], { queryParams: { q: term } });
  }

}
