import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { AuthService } from '../../services/auth.service';
import { PaymentMethod, ProductsService } from '../../services/products.service';

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
  imports: [IonContent, IonIcon, RouterLink, ReactiveFormsModule, NavbarComponent],
})
export class PerfilPage {

  private readonly auth = inject(AuthService);
  private readonly productsService = inject(ProductsService);
  private readonly fb = inject(FormBuilder);

  readonly user = this.auth.currentUser;
  readonly isAdmin = this.auth.isAdmin;

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

  // --- Método de pago simulado (solo para mostrar en "Mis compras"; no procesa cobros reales) ---
  readonly paymentMethod = signal<PaymentMethod | null>(null);
  readonly editingPayment = signal(false);
  readonly paymentSaving = signal(false);
  readonly paymentError = signal<string | null>(null);

  readonly paymentForm = this.fb.group({
    bankName: ['', [Validators.required, Validators.minLength(2)]],
    holderName: ['', [Validators.required, Validators.minLength(3)]],
    last4: ['', [Validators.required, Validators.pattern(/^[0-9]{4}$/)]],
  });

  constructor() {
    if (this.user()) {
      this.productsService.getPaymentMethod().subscribe({
        next: (method) => {
          this.paymentMethod.set(method);
          if (method) {
            this.paymentForm.patchValue(method);
          } else {
            this.editingPayment.set(true);
          }
        },
      });
    }
  }

  get bankName() {
    return this.paymentForm.controls.bankName;
  }

  get holderName() {
    return this.paymentForm.controls.holderName;
  }

  get last4() {
    return this.paymentForm.controls.last4;
  }

  editPayment(): void {
    this.paymentError.set(null);
    this.editingPayment.set(true);
  }

  cancelEditPayment(): void {
    const current = this.paymentMethod();
    if (current) {
      this.paymentForm.patchValue(current);
      this.editingPayment.set(false);
    }
    this.paymentError.set(null);
  }

  savePayment(): void {
    this.paymentError.set(null);

    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    this.paymentSaving.set(true);
    const value = this.paymentForm.getRawValue() as PaymentMethod;

    this.productsService.savePaymentMethod(value).subscribe({
      next: (method) => {
        this.paymentMethod.set(method);
        this.editingPayment.set(false);
        this.paymentSaving.set(false);
      },
      error: () => {
        this.paymentError.set('No se pudo guardar el método de pago. Intenta de nuevo.');
        this.paymentSaving.set(false);
      },
    });
  }

  removePayment(): void {
    this.productsService.deletePaymentMethod().subscribe({
      next: () => {
        this.paymentMethod.set(null);
        this.paymentForm.reset();
        this.editingPayment.set(true);
      },
    });
  }

  logout(): void {
    this.auth.logout();
    // Igual que en el navbar: recarga completa para no dejar en memoria
    // datos de la sesión anterior.
    window.location.href = '/login';
  }

}
