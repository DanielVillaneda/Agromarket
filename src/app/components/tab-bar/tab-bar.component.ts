import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IonIcon } from '@ionic/angular';
import { ProductsService } from '../../services/products.service';

interface Tab {
  label: string;
  path: string;
  icon: string;
  exact?: boolean;
  /** Botón central destacado (Vender). */
  primary?: boolean;
}

/**
 * Barra de pestañas inferior para celulares. Solo se ve en pantallas de
 * menos de 768px (ver tab-bar.component.scss); en PC la navegación sigue
 * siendo la barra superior (NavbarComponent).
 */
@Component({
  selector: 'app-tab-bar',
  templateUrl: './tab-bar.component.html',
  styleUrls: ['./tab-bar.component.scss'],
  imports: [RouterLink, RouterLinkActive, IonIcon],
})
export class TabBarComponent {

  private readonly productsService = inject(ProductsService);

  readonly cartCount = this.productsService.cartCount;

  readonly tabs: Tab[] = [
    { label: 'Inicio', path: '/home', icon: 'home-outline', exact: true },
    { label: 'Favoritos', path: '/favoritos', icon: 'heart-outline' },
    { label: 'Vender', path: '/vender', icon: 'add-outline', primary: true },
    { label: 'Carrito', path: '/carritocompras', icon: 'cart-outline' },
    { label: 'Perfil', path: '/perfil', icon: 'person-outline' },
  ];

}
