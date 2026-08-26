import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IonHeader, IonToolbar } from '@ionic/angular';

interface NavLink {
  label: string;
  path: string;
  exact?: boolean;
}

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  imports: [RouterLink, RouterLinkActive, IonHeader, IonToolbar],
})
export class NavbarComponent {

  readonly navLinks: NavLink[] = [
    { label: 'Inicio', path: '/home', exact: true },
    { label: 'Venta', path: '/venta' },
    { label: 'Favoritos', path: '/favoritos' },
    { label: 'Mis Compras', path: '/compras' },
    { label: 'Sobre Nosotros', path: '/sobre-nosotros' },
  ];

}
