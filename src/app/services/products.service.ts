import { HttpClient } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Product } from '../components/product-card/product-card.component';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export const PRODUCT_UNITS = ['kilo', 'tonelada', 'libra', 'litro', 'unidad'] as const;
export type ProductUnit = (typeof PRODUCT_UNITS)[number];

export const PRODUCT_UNIT_LABELS: Record<ProductUnit, string> = {
  kilo: 'Kilos',
  tonelada: 'Toneladas',
  libra: 'Libras',
  litro: 'Litros',
  unidad: 'Unidades',
};

export const WEIGHT_UNITS = ['kilo', 'tonelada', 'libra'] as const;
export type WeightUnit = (typeof WEIGHT_UNITS)[number];

const GRAMS_PER_UNIT: Record<WeightUnit, number> = {
  kilo: 1000,
  tonelada: 1_000_000,
  libra: 453.59237,
};

export function isWeightUnit(unit: string): unit is WeightUnit {
  return (WEIGHT_UNITS as readonly string[]).includes(unit);
}

/** Misma regla que el backend: se puede convertir si son la misma unidad, o si ambas son de peso. */
export function canConvertUnit(fromUnit: string, toUnit: string): boolean {
  return fromUnit === toUnit || (isWeightUnit(fromUnit) && isWeightUnit(toUnit));
}

export function convertWeight(amount: number, fromUnit: string, toUnit: string): number {
  if (fromUnit === toUnit) {
    return amount;
  }
  if (!isWeightUnit(fromUnit) || !isWeightUnit(toUnit)) {
    return amount;
  }
  const grams = amount * GRAMS_PER_UNIT[fromUnit];
  return grams / GRAMS_PER_UNIT[toUnit];
}

export function convertPrice(pricePerFromUnit: number, fromUnit: string, toUnit: string): number {
  if (fromUnit === toUnit) {
    return pricePerFromUnit;
  }
  return pricePerFromUnit * convertWeight(1, toUnit, fromUnit);
}

interface ApiProduct {
  id: number;
  title: string;
  price: number;
  location: string;
  icon: string;
  accent: string;
  description: string | null;
  quantity: number;
  unit: ProductUnit;
  photos: string[];
  sellerId: number;
  sellerName: string;
  sellerPhone: string;
  sellerEmail: string;
  createdAt: string;
  updatedAt: string;
}

interface CartResponse {
  items: { product: ApiProduct; quantity: number; unit: ProductUnit }[];
  total: number;
  count: number;
}

interface PurchaseResponse {
  id: number;
  quantity: number;
  unit: ProductUnit;
  unitPrice: number;
  purchasedAt: string;
  product: ApiProduct;
}

export interface ProductInput {
  title: string;
  price: number;
  location: string;
  description: string;
  quantity: number;
  unit: ProductUnit;
  photos?: string[];
}

/**
 * Fuente de datos de productos para toda la app: envuelve las llamadas HTTP
 * al backend (ver `backend/src/modules/products|favorites|cart|purchases`)
 * y expone el mismo tipo de signals que antes usaba el mock, para que las
 * páginas casi no tengan que cambiar. Los datos que dependen de sesión
 * (mis productos, favoritos, carrito, compras, vistos recientemente) se
 * recargan automáticamente cuando cambia el estado de autenticación.
 */
@Injectable({ providedIn: 'root' })
export class ProductsService {

  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly apiUrl = environment.apiUrl;

  private readonly _marketProducts = signal<Product[]>([]);
  private readonly _searchableProducts = signal<Product[]>([]);
  private readonly _myProducts = signal<Product[]>([]);
  private readonly _favoriteProducts = signal<Product[]>([]);
  private readonly _purchasedProducts = signal<Product[]>([]);
  private readonly _recentlyViewedProducts = signal<Product[]>([]);
  private readonly _cartItems = signal<{ product: Product; quantity: number; unit: ProductUnit }[]>([]);
  private readonly _cartTotal = signal(0);
  private readonly _cartCount = signal(0);

  readonly topSearches: string[] = ['Café', 'Aguacate', 'Miel', 'Queso', 'Semillas'];

  readonly marketProducts = this._marketProducts.asReadonly();
  readonly myProducts = this._myProducts.asReadonly();
  readonly favoriteProducts = this._favoriteProducts.asReadonly();
  readonly purchasedProducts = this._purchasedProducts.asReadonly();
  readonly recentlyViewedProducts = this._recentlyViewedProducts.asReadonly();

  readonly cartItems = computed(() => this._cartItems());
  readonly cartTotal = this._cartTotal.asReadonly();
  readonly cartCount = this._cartCount.asReadonly();

  constructor() {
    effect(() => {
      // Leer isAuthenticated() aquí hace que el effect se vuelva a ejecutar
      // en cada login/logout, así el mercado se recarga con el filtro
      // correcto (el backend excluye los productos propios del vendedor).
      const authenticated = this.auth.isAuthenticated();

      this.loadMarketProducts();
      this.loadSearchableProducts();

      if (authenticated) {
        this.loadMyProducts();
        this.loadFavorites();
        this.loadCart();
        this.loadPurchases();
        this.loadRecentlyViewed();
      } else {
        this._myProducts.set([]);
        this._favoriteProducts.set([]);
        this._cartItems.set([]);
        this._cartTotal.set(0);
        this._cartCount.set(0);
        this._purchasedProducts.set([]);
        this._recentlyViewedProducts.set([]);
      }
    });
  }

  getProduct(id: number): Observable<Product> {
    return this.http.get<ApiProduct>(`${this.apiUrl}/products/${id}`).pipe(map((p) => this.mapProduct(p)));
  }

  createProduct(input: ProductInput): Observable<Product> {
    return this.http.post<ApiProduct>(`${this.apiUrl}/products`, input).pipe(
      map((p) => this.mapProduct(p)),
      tap((product) => {
        this._myProducts.update((list) => [product, ...list]);
        this._searchableProducts.update((list) => [product, ...list]);
      }),
    );
  }

  updateMyProduct(id: number, changes: Partial<ProductInput>): Observable<Product> {
    return this.http.put<ApiProduct>(`${this.apiUrl}/products/${id}`, changes).pipe(
      map((p) => this.mapProduct(p)),
      tap((product) => {
        this._myProducts.update((list) => list.map((item) => (item.id === id ? product : item)));
        this._searchableProducts.update((list) => list.map((item) => (item.id === id ? product : item)));
      }),
    );
  }

  removeMyProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/products/${id}`).pipe(
      tap(() => {
        this._myProducts.update((list) => list.filter((item) => item.id !== id));
        this._searchableProducts.update((list) => list.filter((item) => item.id !== id));
      }),
    );
  }

  isFavorite(id: number): boolean {
    return this._favoriteProducts().some((product) => product.id === id);
  }

  toggleFavorite(id: number): Observable<{ isFavorite: boolean }> {
    return this.http.post<{ isFavorite: boolean }>(`${this.apiUrl}/favorites/${id}`, {}).pipe(
      tap(() => this.loadFavorites()),
    );
  }

  isPurchased(id: number): boolean {
    return this._purchasedProducts().some((product) => product.id === id);
  }

  getCartQuantity(id: number): number {
    return this._cartItems().find((item) => item.product.id === id)?.quantity ?? 0;
  }

  getCartUnit(id: number): ProductUnit | undefined {
    return this._cartItems().find((item) => item.product.id === id)?.unit;
  }

  isInCart(id: number): boolean {
    return this.getCartQuantity(id) > 0;
  }

  addToCart(id: number, quantity = 1, unit?: ProductUnit): Observable<{ quantity: number; unit: ProductUnit }> {
    return this.http
      .post<{ quantity: number; unit: ProductUnit }>(`${this.apiUrl}/cart/${id}`, { quantity, unit })
      .pipe(tap(() => this.loadCart()));
  }

  updateCartQuantity(
    id: number,
    quantity: number,
    unit?: ProductUnit,
  ): Observable<{ quantity: number; unit: ProductUnit }> {
    return this.http
      .put<{ quantity: number; unit: ProductUnit }>(`${this.apiUrl}/cart/${id}`, { quantity, unit })
      .pipe(tap(() => this.loadCart()));
  }

  removeFromCart(id: number): void {
    this.http.delete(`${this.apiUrl}/cart/${id}`).subscribe(() => this.loadCart());
  }

  clearCart(): void {
    this.http.delete(`${this.apiUrl}/cart`).subscribe(() => this.loadCart());
  }

  checkout(): Observable<{ purchasedCount: number }> {
    return this.http.post<{ purchasedCount: number }>(`${this.apiUrl}/purchases/checkout`, {}).pipe(
      tap(() => {
        this.loadCart();
        this.loadPurchases();
      }),
    );
  }

  searchProducts(query: string): Product[] {
    const normalized = this.normalize(query);

    if (!normalized) {
      return [];
    }

    return this._searchableProducts().filter((product) =>
      this.normalize(product.title).includes(normalized),
    );
  }

  private loadMarketProducts(): void {
    this.http.get<ApiProduct[]>(`${this.apiUrl}/products`).subscribe({
      next: (products) => this._marketProducts.set(products.map((p) => this.mapProduct(p))),
    });
  }

  /**
   * Igual que loadMarketProducts, pero incluyendo los productos propios: la
   * búsqueda sí debe encontrar lo que tú mismo publicaste, aunque "Lo más
   * reciente" (marketProducts) no lo muestre.
   */
  private loadSearchableProducts(): void {
    this.http.get<ApiProduct[]>(`${this.apiUrl}/products`, { params: { includeMine: true } }).subscribe({
      next: (products) => this._searchableProducts.set(products.map((p) => this.mapProduct(p))),
    });
  }

  private loadMyProducts(): void {
    this.http.get<ApiProduct[]>(`${this.apiUrl}/products/mine`).subscribe({
      next: (products) => this._myProducts.set(products.map((p) => this.mapProduct(p))),
    });
  }

  private loadFavorites(): void {
    this.http.get<ApiProduct[]>(`${this.apiUrl}/favorites`).subscribe({
      next: (products) => this._favoriteProducts.set(products.map((p) => this.mapProduct(p))),
    });
  }

  private loadCart(): void {
    this.http.get<CartResponse>(`${this.apiUrl}/cart`).subscribe({
      next: (res) => {
        this._cartItems.set(
          res.items.map((item) => ({
            product: this.mapProduct(item.product),
            quantity: item.quantity,
            unit: item.unit,
          })),
        );
        this._cartTotal.set(res.total);
        this._cartCount.set(res.count);
      },
    });
  }

  private loadPurchases(): void {
    this.http.get<PurchaseResponse[]>(`${this.apiUrl}/purchases`).subscribe({
      next: (purchases) => this._purchasedProducts.set(purchases.map((purchase) => this.mapProduct(purchase.product))),
    });
  }

  private loadRecentlyViewed(): void {
    this.http.get<ApiProduct[]>(`${this.apiUrl}/recently-viewed`).subscribe({
      next: (products) => this._recentlyViewedProducts.set(products.map((p) => this.mapProduct(p))),
    });
  }

  private mapProduct(p: ApiProduct): Product {
    return {
      id: p.id,
      title: p.title,
      price: this.formatPrice(p.price),
      rawPrice: p.price,
      location: p.location,
      icon: p.icon,
      accent: p.accent,
      description: p.description ?? undefined,
      quantity: `${p.quantity} ${PRODUCT_UNIT_LABELS[p.unit] ?? PRODUCT_UNIT_LABELS.unidad} disponibles`,
      rawQuantity: p.quantity,
      unit: p.unit,
      photos: p.photos,
      sellerId: p.sellerId,
      sellerName: p.sellerName,
      sellerPhone: p.sellerPhone,
      sellerEmail: p.sellerEmail,
    };
  }

  private formatPrice(value: number): string {
    return `$${value.toLocaleString('es-CO')}`;
  }

  private normalize(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .trim();
  }

}
