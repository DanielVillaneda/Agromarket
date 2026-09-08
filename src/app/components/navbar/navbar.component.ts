import {
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { IonHeader, IonToolbar, IonIcon } from '@ionic/angular';
import { ProductsService } from '../../services/products.service';
import { Product } from '../product-card/product-card.component';
import { cartOutline, searchOutline } from 'ionicons/icons';

interface NavLink {
  label: string;
  path: string;
  exact?: boolean;
}

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  imports: [RouterLink, RouterLinkActive, IonHeader, IonToolbar, IonIcon],
})
export class NavbarComponent {

  cartOutline = cartOutline;
  searchOutline = searchOutline;

  private readonly productsService = inject(ProductsService);
  private readonly router = inject(Router);

  readonly cartCount = this.productsService.cartCount;
  readonly topSearches = this.productsService.topSearches;

  readonly searchQuery = signal('');
  readonly isOpen = signal(false);

  readonly panelTop = signal(0);
  readonly panelLeft = signal(0);
  readonly panelWidth = signal(0);

  /**
   * El panel de sugerencias se pinta fuera de <ion-toolbar> (como hermano
   * dentro de <ion-header>) porque el shadow DOM de ion-toolbar recorta
   * cualquier contenido posicionado en absoluto dentro de él
   * (.toolbar-container tiene overflow: hidden). Por eso su posición se
   * calcula por JS con getBoundingClientRect() en vez de con CSS relativo
   * al buscador.
   */
  @ViewChild('searchWrapper') private readonly searchWrapperRef?: ElementRef<HTMLElement>;
  @ViewChild('searchPanel') private readonly searchPanelRef?: ElementRef<HTMLElement>;

  readonly suggestions = computed<Product[]>(() => {
    const query = this.searchQuery().trim();

    if (!query) {
      return [];
    }

    return this.productsService.searchProducts(query).slice(0, 6);
  });

  readonly navLinks: NavLink[] = [
    { label: 'Inicio', path: '/home', exact: true },
    { label: 'Venta', path: '/venta' },
    { label: 'Favoritos', path: '/favoritos' },
    { label: 'Mis Compras', path: '/compras' },
    { label: 'Sobre Nosotros', path: '/nosotros' },
  ];

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
    this.open();
  }

  onFocus(): void {
    this.open();
  }

  selectTerm(term: string): void {
    this.searchQuery.set(term);
    this.goSearch();
  }

  selectSuggestion(product: Product): void {
    this.searchQuery.set(product.title);
    this.goSearch();
  }

  goSearch(): void {
    const query = this.searchQuery().trim();
    this.close();
    this.router.navigate(['/search'], query ? { queryParams: { q: query } } : {});
  }

  close(): void {
    this.isOpen.set(false);
  }

  private open(): void {
    this.isOpen.set(true);
    // La posición se recalcula en el siguiente ciclo para que el panel ya
    // exista en el DOM (por el @if) y su ancho/alto sea medible.
    setTimeout(() => this.updatePanelPosition());
  }

  private updatePanelPosition(): void {
    const wrapper = this.searchWrapperRef?.nativeElement;

    if (!wrapper) {
      return;
    }

    const rect = wrapper.getBoundingClientRect();
    const width = Math.max(rect.width, 300);
    const maxLeft = window.innerWidth - width - 12;

    this.panelTop.set(rect.bottom + 8);
    this.panelLeft.set(Math.max(12, Math.min(rect.left, maxLeft)));
    this.panelWidth.set(width);
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.isOpen()) {
      this.updatePanelPosition();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isOpen()) {
      return;
    }

    const target = event.target as Node;
    const wrapper = this.searchWrapperRef?.nativeElement;
    const panel = this.searchPanelRef?.nativeElement;

    if (wrapper?.contains(target) || panel?.contains(target)) {
      return;
    }

    this.close();
  }

}
