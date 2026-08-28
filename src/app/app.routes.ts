import { Routes } from '@angular/router';

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
    loadComponent: () => import('./pages/registro/registro.page').then( m => m.RegistroPage)
  },
  {
    path: 'venta',
    loadComponent: () => import('./pages/venta/venta.page').then( m => m.VentaPage)
  },
  {
    path: 'vender',
    loadComponent: () => import('./pages/vender/vender.page').then( m => m.VenderPage)
  },
  {
    path: 'producto/:id',
    loadComponent: () => import('./pages/producto/producto.page').then( m => m.ProductoPage)
  },
  {
    path: 'producto-vender/:id',
    loadComponent: () => import('./pages/producto-vender/producto-vender.page').then( m => m.ProductoVenderPage)
  },
  {
    path: 'favoritos',
    loadComponent: () => import('./pages/favoritos/favoritos.page').then( m => m.FavoritosPage)
  },
  {
    path: 'compras',
    loadComponent: () => import('./pages/compras/compras.page').then( m => m.ComprasPage)
  },
  {
    path: 'nosotros',
    loadComponent: () => import('./pages/nosotros/nosotros.page').then( m => m.NosotrosPage)
  },
  {
    path: 'carritocompras',
    loadComponent: () => import('./pages/carritocompras/carritocompras.page').then( m => m.CarritocomprasPage)
  },
  {
    path: 'search',
    loadComponent: () => import('./pages/search/search.page').then( m => m.SearchPage)
  },
];
