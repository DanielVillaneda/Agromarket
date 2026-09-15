<<<<<<< HEAD
import { Component, signal } from '@angular/core';
import { IonContent } from '@ionic/angular';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
=======
import { Component, inject, signal } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular';
import { Router, RouterLink } from '@angular/router';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
>>>>>>> a6bed8d274dbf04d769eac150cb6a74b0026908a

type AuthMode = 'login' | 'registro';

function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  return password && confirmPassword && password !== confirmPassword
    ? { passwordsMismatch: true }
    : null;
}

/**
 * Página de acceso con diseño deslizable: un mismo panel contiene los
 * formularios de inicio de sesión y de registro, y un panel superpuesto se
 * desliza para alternar entre ambos (en escritorio) o simplemente se anima
 * horizontalmente entre las dos tarjetas (en móvil). Las rutas '/login' y
 * '/registro' cargan este mismo componente; el modo inicial depende de con
 * cuál de las dos se entró, y a partir de ahí el cambio es puramente visual
 * (no vuelve a navegar), para que la animación de deslizamiento se vea.
 */
@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [IonContent, IonIcon, RouterLink, ReactiveFormsModule],
})
export class LoginPage {

<<<<<<< HEAD
  submitted = false;
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
=======
  private readonly router = inject(Router);
>>>>>>> a6bed8d274dbf04d769eac150cb6a74b0026908a

  readonly mode = signal<AuthMode>(this.router.url.includes('registro') ? 'registro' : 'login');

  loginSubmitted = false;
  registroSubmitted = false;

  readonly loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

<<<<<<< HEAD
  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}
=======
  readonly registroForm: FormGroup = this.fb.group(
    {
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{7,10}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatchValidator },
  );

  constructor(private fb: FormBuilder) {}
>>>>>>> a6bed8d274dbf04d769eac150cb6a74b0026908a

  get loginEmail() {
    return this.loginForm.controls['email'];
  }

  get loginPassword() {
    return this.loginForm.controls['password'];
  }

<<<<<<< HEAD
  onSubmit(): void {
    this.submitted = true;
    this.errorMessage.set(null);
=======
  get nombre() {
    return this.registroForm.controls['nombre'];
  }
>>>>>>> a6bed8d274dbf04d769eac150cb6a74b0026908a

  get registroEmail() {
    return this.registroForm.controls['email'];
  }

  get telefono() {
    return this.registroForm.controls['telefono'];
  }

  get registroPassword() {
    return this.registroForm.controls['password'];
  }

  get confirmPassword() {
    return this.registroForm.controls['confirmPassword'];
  }

  setMode(mode: AuthMode): void {
    this.mode.set(mode);
  }

  onLoginSubmit(): void {
    this.loginSubmitted = true;

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

<<<<<<< HEAD
    const { email, password } = this.form.value;
    this.loading.set(true);

    this.auth.login(email, password).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigateByUrl('/home');
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message ?? 'No se pudo iniciar sesión. Intenta de nuevo.');
      },
    });
=======
    // TODO: conectar con el servicio de autenticación cuando el backend esté disponible.
    console.log('Login form value', this.loginForm.value);
  }

  onRegistroSubmit(): void {
    this.registroSubmitted = true;

    if (this.registroForm.invalid) {
      this.registroForm.markAllAsTouched();
      return;
    }

    // TODO: conectar con el servicio de registro cuando el backend esté disponible.
    console.log('Registro form value', this.registroForm.value);
>>>>>>> a6bed8d274dbf04d769eac150cb6a74b0026908a
  }

}
