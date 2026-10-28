import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AdminStats {
  usersCount: number;
  productsCount: number;
  purchasesCount: number;
  totalSales: number;
}

export interface AdminUser {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  role: 'user' | 'admin';
  isBlocked: boolean;
  createdAt: string;
}

export interface AdminProduct {
  id: number;
  title: string;
  price: number;
  location: string;
  quantity: number;
  unit: string;
  sellerId: number;
  sellerName: string;
  sellerEmail: string;
  createdAt: string;
}

/** Llamadas al panel de administración (/api/admin/*); solo responden si el usuario tiene rol admin. */
@Injectable({ providedIn: 'root' })
export class AdminService {

  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.apiUrl}/admin/stats`);
  }

  getUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.apiUrl}/admin/users`);
  }

  setUserBlocked(id: number, blocked: boolean): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`${this.apiUrl}/admin/users/${id}/bloqueo`, { blocked });
  }

  getProducts(): Observable<AdminProduct[]> {
    return this.http.get<AdminProduct[]>(`${this.apiUrl}/admin/products`);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/admin/products/${id}`);
  }

}
