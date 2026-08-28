import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { IonHeader, IonToolbar, IonIcon } from '@ionic/angular';
import { ProductsService } from '../../services/products.service';
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

  readonly searchQuery = signal('');

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
  }

  goSearch(): void {
    const query = this.searchQuery().trim();
    this.router.navigate(['/search'], query ? { queryParams: { q: query } } : {});
  }

}
