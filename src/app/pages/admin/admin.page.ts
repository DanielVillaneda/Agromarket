import { Component, inject, signal } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { AdminProduct, AdminService, AdminStats, AdminUser } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';

type AdminTab = 'resumen' | 'usuarios' | 'productos';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
  imports: [IonContent, IonIcon, NavbarComponent],
})
export class AdminPage {

  private readonly adminService = inject(AdminService);
  private readonly auth = inject(AuthService);

  readonly currentUserId = this.auth.currentUser()?.id;

  readonly tab = signal<AdminTab>('resumen');

  readonly stats = signal<AdminStats | null>(null);
  readonly users = signal<AdminUser[]>([]);
  readonly products = signal<AdminProduct[]>([]);

  readonly loadingUsers = signal(false);
  readonly loadingProducts = signal(false);
  readonly actionError = signal<string | null>(null);

  constructor() {
    this.adminService.getStats().subscribe((stats) => this.stats.set(stats));
    this.loadUsers();
    this.loadProducts();
  }

  setTab(tab: AdminTab): void {
    this.tab.set(tab);
  }

  private loadUsers(): void {
    this.loadingUsers.set(true);
    this.adminService.getUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loadingUsers.set(false);
      },
      error: () => this.loadingUsers.set(false),
    });
  }

  private loadProducts(): void {
    this.loadingProducts.set(true);
    this.adminService.getProducts().subscribe({
      next: (products) => {
        this.products.set(products);
        this.loadingProducts.set(false);
      },
      error: () => this.loadingProducts.set(false),
    });
  }

  toggleBlock(user: AdminUser): void {
    this.actionError.set(null);
    const nextBlocked = !user.isBlocked;

    this.adminService.setUserBlocked(user.id, nextBlocked).subscribe({
      next: (updated) => {
        this.users.update((list) => list.map((u) => (u.id === updated.id ? updated : u)));
      },
      error: (err) => {
        this.actionError.set(err.error?.message ?? 'No se pudo actualizar el usuario.');
      },
    });
  }

  deleteProduct(product: AdminProduct): void {
    this.actionError.set(null);

    if (!confirm(`¿Eliminar "${product.title}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    this.adminService.deleteProduct(product.id).subscribe({
      next: () => {
        this.products.update((list) => list.filter((p) => p.id !== product.id));
        this.stats.update((current) =>
          current ? { ...current, productsCount: current.productsCount - 1 } : current,
        );
      },
      error: (err) => {
        this.actionError.set(err.error?.message ?? 'No se pudo eliminar el producto.');
      },
    });
  }

  formatPrice(value: number): string {
    return `$${value.toLocaleString('es-CO')}`;
  }

}
