import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { AuthService } from '../../services/auth.service';

interface ProfileLink {
  label: string;
  path: string;
  icon: string;
}

/**
 * Página "Perfil" de la barra de pestañas en celular: agrupa las secciones
 * que en PC están en la barra superior (Venta, Mis compras, Favoritos,
 * Sobre nosotros) y la sesión. Sin sesión, invita a iniciarla.
 */
@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  imports: [IonContent, IonIcon, RouterLink, NavbarComponent],
})
export class PerfilPage {

  private readonly auth = inject(AuthService);

  readonly user = this.auth.currentUser;

  readonly initials = computed(() => {
    const nombre = this.user()?.nombre ?? '';
    return nombre
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0].toUpperCase())
      .join('');
  });

  readonly accountLinks: ProfileLink[] = [
    { label: 'Mis productos en venta', path: '/venta', icon: 'storefront-outline' },
    { label: 'Mis compras', path: '/compras', icon: 'receipt-outline' },
    { label: 'Favoritos', path: '/favoritos', icon: 'heart-outline' },
  ];

  logout(): void {
    this.auth.logout();
    // Igual que en el navbar: recarga completa para no dejar en memoria
    // datos de la sesión anterior.
    window.location.href = '/login';
  }

}
