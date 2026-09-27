import { AfterViewInit, Component, ElementRef, HostListener, inject, ViewChild } from '@angular/core';
import { IonContent, IonIcon, ViewDidEnter } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { ProductsService } from '../../services/products.service';
import { FooterComponent } from '../../components/footer/footer.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [IonContent, IonIcon, RouterLink, ProductCardComponent, NavbarComponent, FooterComponent],
})
export class HomePage implements AfterViewInit, ViewDidEnter {
  private readonly productsService = inject(ProductsService);
  readonly products = this.productsService.marketProducts;
  readonly productsLoaded = this.productsService.marketProductsLoaded;

  @ViewChild('heroVideo') private readonly heroVideoRef?: ElementRef<HTMLVideoElement>;

  ngAfterViewInit(): void {
    // Algunos navegadores no respetan el autoplay declarado en el HTML si el
    // video queda listo antes de que la página termine de montarse (típico
    // en transiciones de Ionic). Forzamos la reproducción por JS como respaldo.
    this.playHeroVideo();
  }

  // Al montarse, la página todavía está invisible por la animación de entrada
  // de Ionic y el navegador puede no arrancar el video (pasaba al volver del
  // login, que recarga /home). Cuando Ionic termina la transición y la página
  // ya se ve, se intenta de nuevo.
  ionViewDidEnter(): void {
    this.playHeroVideo();
  }

  // Al volver a esta pestaña del navegador (o desbloquear el celular), el
  // navegador pudo haber pausado el video mientras no se veía.
  @HostListener('document:visibilitychange')
  onVisibilityChange(): void {
    if (document.visibilityState === 'visible') {
      this.playHeroVideo();
    }
  }

  private playHeroVideo(): void {
    const video = this.heroVideoRef?.nativeElement;

    if (!video || !video.paused) {
      return;
    }

    video.muted = true;
    video.play().catch(() => {
      // Si el navegador bloquea el autoplay igual, se deja el video pausado
      // en el primer frame en vez de romper la página.
    });
  }
}
