import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { IonContent, IonIcon } from '@ionic/angular';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { PRODUCT_UNITS, PRODUCT_UNIT_LABELS, ProductUnit, ProductsService } from '../../services/products.service';

interface ProductImage {
  id: number;
  dataUrl: string;
}

@Component({
  selector: 'app-vender',
  templateUrl: './vender.page.html',
  styleUrls: ['./vender.page.scss'],
  imports: [IonContent, IonIcon, RouterLink, ReactiveFormsModule, NavbarComponent],
})
export class VenderPage {

  private readonly productsService = inject(ProductsService);
  private readonly router = inject(Router);

  submitted = false;
  submitError = signal<string | null>(null);
  readonly images = signal<ProductImage[]>([]);

  private nextImageId = 1;

  readonly unitOptions = PRODUCT_UNITS;
  readonly unitLabels = PRODUCT_UNIT_LABELS;

  readonly form: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    precio: ['', [Validators.required, Validators.min(1)]],
    cantidad: ['', [Validators.required, Validators.min(1)]],
    unidad: ['unidad' as ProductUnit, [Validators.required]],
    ubicacion: ['', [Validators.required]],
    descripcion: ['', [Validators.required, Validators.minLength(10)]],
  });

  constructor(private fb: FormBuilder) {}

  get nombre() {
    return this.form.controls['nombre'];
  }

  get precio() {
    return this.form.controls['precio'];
  }

  get cantidad() {
    return this.form.controls['cantidad'];
  }

  get unidad() {
    return this.form.controls['unidad'];
  }

  get ubicacion() {
    return this.form.controls['ubicacion'];
  }

  get descripcion() {
    return this.form.controls['descripcion'];
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
        this.images.update((current) => [...current, { id: this.nextImageId++, dataUrl: reader.result as string }]);
      };
      reader.readAsDataURL(file);
    });

    input.value = '';
  }

  removeImage(id: number): void {
    this.images.update((current) => current.filter((image) => image.id !== id));
  }

  onSubmit(): void {
    this.submitted = true;
    this.submitError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.value;

    this.productsService
      .createProduct({
        title: value.nombre,
        price: Number(value.precio),
        location: value.ubicacion,
        description: value.descripcion,
        quantity: Number(value.cantidad),
        unit: value.unidad,
        photos: this.images().map((image) => image.dataUrl),
      })
      .subscribe({
        next: () => this.router.navigateByUrl('/venta'),
        error: (err: HttpErrorResponse) => {
          this.submitError.set(err.error?.message ?? 'No se pudo publicar el producto. Intenta de nuevo.');
        },
      });
  }

}
