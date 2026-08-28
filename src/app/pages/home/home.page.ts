import { AfterViewInit, Component, ElementRef, inject, ViewChild } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { ProductsService } from '../../services/products.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [IonIcon, IonContent, RouterLink, ProductCardComponent],
})
export class HomePage implements AfterViewInit {
  private readonly productsService = inject(ProductsService);
  readonly products = this.productsService.marketProducts;

  @ViewChild('heroVideo') private readonly heroVideoRef?: ElementRef<HTMLVideoElement>;

  ngAfterViewInit(): void {
    // Algunos navegadores no respetan el autoplay declarado en el HTML si el
    // video queda listo antes de que la página termine de montarse (típico
    // en transiciones de Ionic). Forzamos la reproducción por JS como respaldo.
    const video = this.heroVideoRef?.nativeElement;

    if (!video) {
      return;
    }

    video.muted = true;
    video.play().catch(() => {
      // Si el navegador bloquea el autoplay igual, se deja el video pausado
      // en el primer frame en vez de romper la página.
    });
  }
}
