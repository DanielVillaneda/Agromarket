import { Component, inject } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductsService } from '../../services/products.service';

interface GalleryImage {
  id: number;
  icon?: string;
  accent?: string;
  dataUrl?: string;
}

@Component({
  selector: 'app-producto-vender',
  templateUrl: './producto-vender.page.html',
  styleUrls: ['./producto-vender.page.scss'],
  imports: [IonContent, IonIcon, RouterLink, ReactiveFormsModule],
})
export class ProductoVenderPage {

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productsService = inject(ProductsService);
  private readonly fb = inject(FormBuilder);

  private readonly id = Number(this.route.snapshot.paramMap.get('id'));
  private nextImageId = 1;

  readonly product = this.productsService.getMyProduct(this.id);

  saved = false;

  images: GalleryImage[] = (this.product?.photos ?? []).map((icon) => ({
    id: this.nextImageId++,
    icon,
    accent: this.product?.accent,
  }));

  readonly form: FormGroup = this.fb.group({
    nombre: [this.product?.title ?? '', [Validators.required, Validators.minLength(3)]],
    precio: [this.parsePrice(this.product?.price), [Validators.required, Validators.min(1)]],
    cantidad: [this.product?.quantity ?? '', [Validators.required]],
    ubicacion: [this.product?.location ?? '', [Validators.required]],
    descripcion: [this.product?.description ?? '', [Validators.required, Validators.minLength(10)]],
  });

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
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.value;

    this.productsService.updateMyProduct(this.id, {
      title: value.nombre,
      price: `$${Number(value.precio).toLocaleString('es-CO')}`,
      location: value.ubicacion,
      description: value.descripcion,
      quantity: value.cantidad,
    });

    // TODO: subir las fotos nuevas (this.images con dataUrl) al backend cuando esté disponible.
    this.saved = true;
  }

  onDelete(): void {
    this.productsService.removeMyProduct(this.id);
    this.router.navigateByUrl('/venta');
  }

}
