import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IonContent } from '@ionic/angular';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EMPTY, catchError, forkJoin, of, switchMap, tap } from 'rxjs';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { Product, ProductCardComponent } from '../../components/product-card/product-card.component';
import { ProductsService, SellerProfile } from '../../services/products.service';

const ERROR_NO_ENCONTRADO = 'No encontramos este vendedor.';
const ERROR_GENERICO = 'No pudimos cargar el perfil del vendedor. Intenta de nuevo.';

@Component({
  selector: 'app-vendedor',
  templateUrl: './vendedor.page.html',
  styleUrls: ['./vendedor.page.scss'],
  imports: [IonContent, RouterLink, NavbarComponent, FooterComponent, ProductCardComponent],
})
export class VendedorPage {
  private readonly route = inject(ActivatedRoute);
  private readonly productsService = inject(ProductsService);

  readonly vendedor = signal<SellerProfile | null>(null);
  readonly productos = signal<Product[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

  constructor() {
    // Lee el id de forma reactiva: al pasar de un perfil a otro se recarga
    // sin destruir el componente (switchMap cancela la petición anterior).
    this.route.paramMap
      .pipe(
        tap(() => {
          this.vendedor.set(null);
          this.productos.set([]);
          this.error.set(null);
          this.cargando.set(true);
        }),
        switchMap((params) => {
          const texto = params.get('id') ?? '';
          const id = Number(texto);
          if (!/^\d+$/.test(texto) || !Number.isSafeInteger(id) || id <= 0) {
            this.error.set(ERROR_NO_ENCONTRADO);
            this.cargando.set(false);
            return EMPTY;
          }
          return forkJoin({
            vendedor: this.productsService.getSellerProfile(id),
            productos: this.productsService.getSellerProducts(id),
          }).pipe(
            catchError((err: unknown) => {
              const status = err instanceof HttpErrorResponse ? err.status : 0;
              this.error.set(status === 404 || status === 400 ? ERROR_NO_ENCONTRADO : ERROR_GENERICO);
              this.cargando.set(false);
              return of(null);
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((datos) => {
        if (datos) {
          this.vendedor.set(datos.vendedor);
          this.productos.set(datos.productos);
          this.cargando.set(false);
        }
      });
  }

  get noEncontrado(): boolean {
    return this.error() === ERROR_NO_ENCONTRADO;
  }
}
