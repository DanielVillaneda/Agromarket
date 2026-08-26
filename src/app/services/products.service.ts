import { Injectable, computed, signal } from '@angular/core';
import { Product } from '../components/product-card/product-card.component';

/**
 * Fuente de datos de productos usada en toda la app mientras no exista un
 * backend real. Centraliza los productos del marketplace (home) y los
 * productos publicados por el usuario actual (venta/vender), y expone
 * operaciones básicas (buscar por id, actualizar, eliminar, favoritos,
 * compras) para que las páginas de detalle y de listado puedan trabajar
 * sobre los mismos datos.
 */
@Injectable({ providedIn: 'root' })
export class ProductsService {

  private readonly _marketProducts = signal<Product[]>([
    {
      id: 1,
      title: 'Abono 100% orgánico',
      price: '$30.000',
      location: 'Rivera · Huila',
      icon: 'leaf-outline',
      accent: 'linear-gradient(135deg, #8d6e63, #5d4037)',
      description: 'Abono orgánico elaborado a partir de compost natural, ideal para mejorar la fertilidad del suelo sin usar químicos.',
      quantity: '50 bultos disponibles',
      photos: ['leaf-outline', 'nutrition-outline', 'flower-outline'],
      sellerName: 'Carlos Pérez',
      sellerPhone: '3201234567',
      sellerEmail: 'carlos.perez@agromarket.co',
    },
    {
      id: 2,
      title: 'Pollitos Criollos para criar',
      price: '$5.000',
      location: 'Campoalegre · Huila',
      icon: 'egg-outline',
      accent: 'linear-gradient(135deg, #ffca28, #fb8c00)',
      description: 'Pollitos criollos de un día de nacidos, criados en finca, resistentes y de buena postura.',
      quantity: '30 unidades disponibles',
      photos: ['egg-outline', 'paw-outline', 'leaf-outline'],
      sellerName: 'María Gómez',
      sellerPhone: '3109876543',
      sellerEmail: 'maria.gomez@agromarket.co',
    },
    {
      id: 3,
      title: 'Semillas para Siembra',
      price: '$5.000',
      location: 'Rivera · Huila',
      icon: 'flower-outline',
      accent: 'linear-gradient(135deg, #9ccc65, #558b2f)',
      description: 'Semillas seleccionadas de hortalizas, con alto porcentaje de germinación.',
      quantity: '100 paquetes disponibles',
      photos: ['flower-outline', 'leaf-outline', 'basket-outline'],
      sellerName: 'Jorge Ramírez',
      sellerPhone: '3157894561',
      sellerEmail: 'jorge.ramirez@agromarket.co',
    },
    {
      id: 4,
      title: 'Yogurt Artesanal',
      price: '$15.000',
      location: 'Palermo · Huila',
      icon: 'nutrition-outline',
      accent: 'linear-gradient(135deg, #90caf9, #42a5f5)',
      description: 'Yogurt artesanal elaborado con leche fresca de finca, sin conservantes.',
      quantity: '20 litros disponibles',
      photos: ['nutrition-outline', 'cafe-outline', 'restaurant-outline'],
      sellerName: 'Diana Torres',
      sellerPhone: '3112223344',
      sellerEmail: 'diana.torres@agromarket.co',
    },
    {
      id: 5,
      title: 'Queso Artesanal',
      price: '$25.000',
      location: 'Yaguará · Huila',
      icon: 'restaurant-outline',
      accent: 'linear-gradient(135deg, #fff59d, #fdd835)',
      description: 'Queso campesino artesanal, elaborado de forma tradicional con leche de vaca.',
      quantity: '15 unidades disponibles',
      photos: ['restaurant-outline', 'nutrition-outline', 'basket-outline'],
      sellerName: 'Pedro Sánchez',
      sellerPhone: '3134445566',
      sellerEmail: 'pedro.sanchez@agromarket.co',
    },
    {
      id: 6,
      title: 'Ruanas de lana tejidas a mano',
      price: '$60.000',
      location: 'La Plata · Huila',
      icon: 'shirt-outline',
      accent: 'linear-gradient(135deg, #ce93d8, #8e24aa)',
      description: 'Ruanas 100% lana virgen, tejidas a mano por artesanas de la región.',
      quantity: '8 unidades disponibles',
      photos: ['shirt-outline', 'leaf-outline', 'basket-outline'],
      sellerName: 'Rosa Martínez',
      sellerPhone: '3167778899',
      sellerEmail: 'rosa.martinez@agromarket.co',
    },
  ]);

  private readonly _myProducts = signal<Product[]>([
    {
      id: 101,
      title: 'Café Orgánico de Altura',
      price: '$18.000',
      location: 'Neiva · Huila',
      icon: 'cafe-outline',
      accent: 'linear-gradient(135deg, #8d6e63, #4e342e)',
      description: 'Café cultivado en las montañas del Huila, tueste medio, cosechado a mano.',
      quantity: '25 kg disponibles',
      photos: ['cafe-outline', 'leaf-outline', 'basket-outline'],
    },
    {
      id: 102,
      title: 'Aguacate Hass',
      price: '$8.000',
      location: 'Rivera · Huila',
      icon: 'nutrition-outline',
      accent: 'linear-gradient(135deg, #9ccc65, #558b2f)',
      description: 'Aguacates Hass frescos, cosechados en finca, ideales para consumo directo.',
      quantity: '40 unidades disponibles',
      photos: ['nutrition-outline', 'leaf-outline', 'basket-outline'],
    },
    {
      id: 103,
      title: 'Miel de Abejas Pura',
      price: '$22.000',
      location: 'Neiva · Huila',
      icon: 'flower-outline',
      accent: 'linear-gradient(135deg, #ffca28, #f9a825)',
      description: 'Miel 100% pura de abejas, extraída artesanalmente sin procesos industriales.',
      quantity: '18 frascos disponibles',
      photos: ['flower-outline', 'nutrition-outline', 'leaf-outline'],
    },
    {
      id: 104,
      title: 'Plátano Verde',
      price: '$4.000',
      location: 'Campoalegre · Huila',
      icon: 'leaf-outline',
      accent: 'linear-gradient(135deg, #aed581, #689f38)',
      description: 'Plátano verde de excelente calidad, recién cosechado.',
      quantity: '60 unidades disponibles',
      photos: ['leaf-outline', 'basket-outline', 'nutrition-outline'],
    },
  ]);

  private readonly _favoriteIds = signal<Set<number>>(new Set());
  private readonly _purchasedIds = signal<Set<number>>(new Set());

  readonly marketProducts = this._marketProducts.asReadonly();
  readonly myProducts = this._myProducts.asReadonly();

  readonly favoriteProducts = computed(() =>
    this._marketProducts().filter((product) => this._favoriteIds().has(product.id)),
  );

  readonly purchasedProducts = computed(() =>
    this._marketProducts().filter((product) => this._purchasedIds().has(product.id)),
  );

  getMarketProduct(id: number): Product | undefined {
    return this._marketProducts().find((product) => product.id === id);
  }

  getMyProduct(id: number): Product | undefined {
    return this._myProducts().find((product) => product.id === id);
  }

  updateMyProduct(id: number, changes: Partial<Product>): void {
    this._myProducts.update((list) =>
      list.map((product) => (product.id === id ? { ...product, ...changes } : product)),
    );
  }

  removeMyProduct(id: number): void {
    this._myProducts.update((list) => list.filter((product) => product.id !== id));
  }

  isFavorite(id: number): boolean {
    return this._favoriteIds().has(id);
  }

  toggleFavorite(id: number): void {
    this._favoriteIds.update((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  isPurchased(id: number): boolean {
    return this._purchasedIds().has(id);
  }

  buyProduct(id: number): void {
    this._purchasedIds.update((current) => {
      const next = new Set(current);
      next.add(id);
      return next;
    });
  }

}
