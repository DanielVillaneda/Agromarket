import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.page').then( m => m.HomePage)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'registro',
    loadComponent: () => import('./pages/login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'venta',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/venta/venta.page').then( m => m.VentaPage)
  },
  {
    path: 'vender',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/vender/vender.page').then( m => m.VenderPage)
  },
  {
    path: 'producto/:id',
    loadComponent: () => import('./pages/producto/producto.page').then( m => m.ProductoPage)
  },
  {
    path: 'producto-vender/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/producto-vender/producto-vender.page').then( m => m.ProductoVenderPage)
  },
  {
    path: 'favoritos',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/favoritos/favoritos.page').then( m => m.FavoritosPage)
  },
  {
    path: 'compras',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/compras/compras.page').then( m => m.ComprasPage)
  },
  {
    path: 'nosotros',
    loadComponent: () => import('./pages/nosotros/nosotros.page').then( m => m.NosotrosPage)
  },
  {
    path: 'carritocompras',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/carritocompras/carritocompras.page').then( m => m.CarritocomprasPage)
  },
  {
    path: 'search',
    loadComponent: () => import('./pages/search/search.page').then( m => m.SearchPage)
  },
];
