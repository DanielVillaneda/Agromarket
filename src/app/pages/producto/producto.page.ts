import { Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { IonContent, IonIcon, IonToast } from '@ionic/angular';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  PRODUCT_UNIT_LABELS,
  ProductUnit,
  ProductsService,
  WEIGHT_UNITS,
  convertPrice,
  convertWeight,
  isWeightUnit,
} from '../../services/products.service';
import { AuthService } from '../../services/auth.service';
import { Product } from '../../components/product-card/product-card.component';
import { NavbarComponent } from '../../components/navbar/navbar.component';

@Component({
  selector: 'app-producto',
  templateUrl: './producto.page.html',
  styleUrls: ['./producto.page.scss'],
  imports: [IonContent, IonIcon, RouterLink, IonToast, NavbarComponent],
})
export class ProductoPage {

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productsService = inject(ProductsService);
  private readonly auth = inject(AuthService);

  private readonly id = Number(this.route.snapshot.paramMap.get('id'));

  readonly product = signal<Product | null>(null);
  readonly loading = signal(true);

  readonly weightUnitOptions = WEIGHT_UNITS;
  readonly unitLabels = PRODUCT_UNIT_LABELS;

  /** Unidad en la que el comprador quiere llevarlo (solo elegible si el producto es de peso). */
  readonly selectedUnit = signal<ProductUnit>('unidad');

  readonly isWeightBased = computed(() => {
    const unit = this.product()?.unit;
    return !!unit && isWeightUnit(unit);
  });

  readonly isFavorite = computed(() => {
    const product = this.product();
    return product ? this.productsService.isFavorite(product.id) : false;
  });

  readonly cartQuantity = computed(() => {
    const product = this.product();
    return product ? this.productsService.getCartQuantity(product.id) : 0;
  });

  /** Una vez que ya hay algo en el carrito, la unidad queda fija a la que ya se eligió. */
  readonly effectiveUnit = computed<ProductUnit>(() => {
    const product = this.product();
    if (!product) {
      return 'unidad';
    }
    if (this.cartQuantity() > 0) {
      return this.productsService.getCartUnit(product.id) ?? this.selectedUnit();
    }
    return this.selectedUnit();
  });

  readonly maxQuantity = computed(() => {
    const product = this.product();
    if (!product) {
      return 0;
    }
    return convertWeight(product.rawQuantity ?? 0, product.unit ?? 'unidad', this.effectiveUnit());
  });

  readonly atMaxQuantity = computed(() => this.cartQuantity() >= this.maxQuantity());

  readonly unitLabel = computed(() => PRODUCT_UNIT_LABELS[this.effectiveUnit()]);

  readonly pricePerSelectedUnit = computed(() => {
    const product = this.product();
    if (!product) {
      return 0;
    }
    return Math.round(convertPrice(product.rawPrice ?? 0, product.unit ?? 'unidad', this.effectiveUnit()));
  });

  readonly pricePerSelectedUnitLabel = computed(() => `$${this.pricePerSelectedUnit().toLocaleString('es-CO')}`);

  readonly showAddedToast = signal(false);
  readonly cartError = signal<string | null>(null);
  readonly cartUpdating = signal(false);

  readonly estrellas = [1, 2, 3, 4, 5];
  readonly haySesion = this.auth.isAuthenticated;
  readonly miCalificacion = signal<number | null>(null);
  readonly ratingAverage = signal<number | null>(null);
  readonly ratingCount = signal(0);
  readonly enviandoCalificacion = signal(false);
  readonly mensajeCalificacion = signal<string | null>(null);
  readonly errorCalificacion = signal<string | null>(null);

  /** Se puede calificar solo con sesión y si el producto no es del usuario. */
  readonly esVendedor = computed(() => {
    const userId = this.auth.currentUser()?.id;
    const sellerId = this.product()?.sellerId;
    return userId !== undefined && userId === sellerId;
  });

  readonly resumenCalificacion = computed(() => {
    const count = this.ratingCount();
    const average = this.ratingAverage();
    if (count === 0 || average === null) {
      return 'Aún sin calificaciones';
    }
    const promedio = average.toLocaleString('es-CO', { maximumFractionDigits: 1 });
    return `${promedio} de 5 · ${count} ${count === 1 ? 'calificación' : 'calificaciones'}`;
  });

  /** Estrellas decorativas del resumen: llena, vacía según el promedio redondeado. */
  readonly estrellasResumen = computed(() => Math.round(this.ratingAverage() ?? 0));

  constructor() {
    this.productsService.getProduct(this.id).subscribe({
      next: (product) => {
        this.product.set(product);
        this.ratingAverage.set(product.ratingAverage ?? null);
        this.ratingCount.set(product.ratingCount ?? 0);
        if (this.auth.isAuthenticated() && !this.esVendedor()) {
          this.productsService.getRatingSummary(this.id).subscribe({
            next: (resumen) => this.miCalificacion.set(resumen.myRating),
            error: () => undefined,
          });
        }
        this.selectedUnit.set((product.unit as ProductUnit) ?? 'unidad');
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  selectUnit(unit: ProductUnit): void {
    if (unit === this.effectiveUnit()) {
      return;
    }

    if (this.cartQuantity() === 0) {
      this.selectedUnit.set(unit);
      return;
    }

    // Ya hay algo en el carrito en otra unidad: se convierte la cantidad
    // actual a la unidad nueva en vez de exigir quitarlo primero.
    const convertedQuantity = Math.max(
      1,
      Math.round(convertWeight(this.cartQuantity(), this.effectiveUnit(), unit)),
    );

    this.cartError.set(null);
    this.cartUpdating.set(true);

    this.productsService.updateCartQuantity(this.id, convertedQuantity, unit).subscribe({
      next: () => {
        this.selectedUnit.set(unit);
        this.cartUpdating.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.cartUpdating.set(false);
        this.cartError.set(err.error?.message ?? 'No se pudo cambiar la unidad.');
      },
    });
  }

  calificar(rating: number): void {
    if (this.enviandoCalificacion()) {
      return;
    }

    this.mensajeCalificacion.set(null);
    this.errorCalificacion.set(null);
    this.enviandoCalificacion.set(true);

    this.productsService.rateProduct(this.id, rating).subscribe({
      next: (resumen) => {
        this.miCalificacion.set(resumen.myRating);
        this.ratingAverage.set(resumen.ratingAverage);
        this.ratingCount.set(resumen.ratingCount);
        this.enviandoCalificacion.set(false);
        this.mensajeCalificacion.set('¡Gracias por tu calificación!');
      },
      error: (err: HttpErrorResponse) => {
        this.enviandoCalificacion.set(false);
        this.errorCalificacion.set(err.error?.message ?? 'No se pudo guardar tu calificación.');
      },
    });
  }

  toggleFavorite(): void {
    if (!this.requireAuth()) {
      return;
    }

    this.productsService.toggleFavorite(this.id).subscribe();
  }

  addToCart(): void {
    if (!this.requireAuth()) {
      return;
    }

    this.cartError.set(null);

    if (this.maxQuantity() <= 0) {
      this.cartError.set('No hay stock disponible de este producto.');
      return;
    }

    this.cartUpdating.set(true);

    this.productsService.addToCart(this.id, 1, this.selectedUnit()).subscribe({
      next: () => {
        this.cartUpdating.set(false);
        this.showAddedToast.set(true);
      },
      error: (err: HttpErrorResponse) => {
        this.cartUpdating.set(false);
        this.cartError.set(err.error?.message ?? 'No se pudo agregar al carrito.');
      },
    });
  }

  increaseCartQuantity(): void {
    if (this.atMaxQuantity()) {
      this.cartError.set(`Solo hay ${Math.round(this.maxQuantity() * 100) / 100} ${this.unitLabel()} disponibles de este producto.`);
      return;
    }

    this.cartError.set(null);
    this.cartUpdating.set(true);

    this.productsService.updateCartQuantity(this.id, this.cartQuantity() + 1).subscribe({
      next: () => this.cartUpdating.set(false),
      error: (err: HttpErrorResponse) => {
        this.cartUpdating.set(false);
        this.cartError.set(err.error?.message ?? 'No se pudo actualizar el carrito.');
      },
    });
  }

  decreaseCartQuantity(): void {
    this.cartUpdating.set(true);
    this.productsService.updateCartQuantity(this.id, this.cartQuantity() - 1).subscribe({
      next: () => this.cartUpdating.set(false),
      error: () => this.cartUpdating.set(false),
    });
  }

  removeFromCart(): void {
    this.productsService.removeFromCart(this.id);
  }

  dismissToast(): void {
    this.showAddedToast.set(false);
  }

  private requireAuth(): boolean {
    if (this.auth.isAuthenticated()) {
      return true;
    }

    this.router.navigateByUrl('/login');
    return false;
  }

}
