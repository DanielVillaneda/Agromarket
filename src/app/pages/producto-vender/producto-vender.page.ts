import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { IonContent, IonIcon } from '@ionic/angular';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductsService } from '../../services/products.service';
import { Product } from '../../components/product-card/product-card.component';
import { NavbarComponent } from '../../components/navbar/navbar.component';

interface GalleryImage {
  id: number;
  dataUrl?: string;
}

@Component({
  selector: 'app-producto-vender',
  templateUrl: './producto-vender.page.html',
  styleUrls: ['./producto-vender.page.scss'],
  imports: [IonContent, IonIcon, RouterLink, ReactiveFormsModule, NavbarComponent],
})
export class ProductoVenderPage {

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productsService = inject(ProductsService);
  private readonly fb = inject(FormBuilder);

  private readonly id = Number(this.route.snapshot.paramMap.get('id'));
  private nextImageId = 1;

  readonly product = signal<Product | null>(null);
  readonly loading = signal(true);
  readonly saveError = signal<string | null>(null);

  saved = false;
  images: GalleryImage[] = [];

  readonly form: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    precio: ['', [Validators.required, Validators.min(1)]],
    cantidad: ['', [Validators.required, Validators.min(1)]],
    ubicacion: ['', [Validators.required]],
    descripcion: ['', [Validators.required, Validators.minLength(10)]],
  });

  constructor() {
    this.productsService.getProduct(this.id).subscribe({
      next: (product) => {
        this.product.set(product);
        this.loading.set(false);
        this.images = (product.photos ?? []).map((url) => ({
          id: this.nextImageId++,
          dataUrl: url,
        }));
        this.form.patchValue({
          nombre: product.title,
          precio: this.parsePrice(product.price),
          cantidad: this.parseQuantity(product.quantity),
          ubicacion: product.location,
          descripcion: product.description ?? '',
        });
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  get nombre() {
    return this.form.controls['nombre'];
  }

  get precio() {
    return this.form.controls['precio'];
  }

  get cantidad() {
    return this.form.controls['cantidad'];
  }

  get ubicacion() {
    return this.form.controls['ubicacion'];
  }

  get descripcion() {
    return this.form.controls['descripcion'];
  }

  private parsePrice(price?: string): number | '' {
    if (!price) {
      return '';
    }

    const digits = price.replace(/[^0-9]/g, '');
    return digits ? Number(digits) : '';
  }

  private parseQuantity(quantity?: string): number | '' {
    if (!quantity) {
      return '';
    }

    const digits = quantity.replace(/[^0-9]/g, '');
    return digits ? Number(digits) : '';
  }

  onImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (!files) {
      return;
    }

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        this.images = [...this.images, { id: this.nextImageId++, dataUrl: reader.result as string }];
      };
      reader.readAsDataURL(file);
    });

    input.value = '';
  }

  removeImage(id: number): void {
    this.images = this.images.filter((image) => image.id !== id);
  }

  onSave(): void {
    this.saveError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.value;

    this.productsService
      .updateMyProduct(this.id, {
        title: value.nombre,
        price: Number(value.precio),
        location: value.ubicacion,
        description: value.descripcion,
        quantity: Number(value.cantidad),
        photos: this.images.map((image) => image.dataUrl).filter((url): url is string => !!url),
      })
      .subscribe({
        next: (product) => {
          this.product.set(product);
          this.saved = true;
        },
        error: (err: HttpErrorResponse) => {
          this.saveError.set(err.error?.message ?? 'No se pudieron guardar los cambios. Intenta de nuevo.');
        },
      });
  }

  onDelete(): void {
    this.productsService.removeMyProduct(this.id).subscribe({
      next: () => this.router.navigateByUrl('/venta'),
      error: (err: HttpErrorResponse) => {
        this.saveError.set(err.error?.message ?? 'No se pudo eliminar el producto. Intenta de nuevo.');
      },
    });
  }

}
