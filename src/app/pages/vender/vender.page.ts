import { Component } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

interface ProductImage {
  id: number;
  dataUrl: string;
}

@Component({
  selector: 'app-vender',
  templateUrl: './vender.page.html',
  styleUrls: ['./vender.page.scss'],
  imports: [IonContent, IonIcon, RouterLink, ReactiveFormsModule],
})
export class VenderPage {

  submitted = false;
  images: ProductImage[] = [];

  private nextImageId = 1;

  readonly form: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    precio: ['', [Validators.required, Validators.min(1)]],
    cantidad: ['', [Validators.required, Validators.min(1)]],
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
        this.images = [...this.images, { id: this.nextImageId++, dataUrl: reader.result as string }];
      };
      reader.readAsDataURL(file);
    });

    input.value = '';
  }

  removeImage(id: number): void {
    this.images = this.images.filter((image) => image.id !== id);
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // TODO: conectar con el servicio de publicación de productos cuando el backend esté disponible.
    console.log('Nuevo producto', { ...this.form.value, images: this.images });
  }

}
