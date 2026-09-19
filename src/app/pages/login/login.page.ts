import { Component, signal } from '@angular/core';
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
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

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

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly mode = signal<AuthMode>(this.router.url.includes('registro') ? 'registro' : 'login');
  readonly registroStep = signal<1 | 2>(1);

  loginSubmitted = false;
  registroSubmitted = false;

  readonly loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

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

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  get loginEmail() {
    return this.loginForm.controls['email'];
  }

  get loginPassword() {
    return this.loginForm.controls['password'];
  }

  get nombre() {
    return this.registroForm.controls['nombre'];
  }

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
    this.errorMessage.set(null);

    if (mode === 'registro') {
      this.registroStep.set(1);
    }
  }

  goToRegistroStep1(): void {
    this.registroStep.set(1);
  }

  onLoginSubmit(): void {
    this.loginSubmitted = true;
    this.errorMessage.set(null);

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.value;
    this.loading.set(true);

    this.auth.login(email, password).subscribe({
      next: () => {
        this.loading.set(false);
        // Recarga completa para que no quede en memoria ningún estado de
        // una sesión anterior (nombre de usuario, productos, carrito, etc.).
        window.location.href = '/home';
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message ?? 'No se pudo iniciar sesión. Intenta de nuevo.');
      },
    });
  }

  onRegistroSubmit(): void {
    this.errorMessage.set(null);

    if (this.registroStep() === 1) {
      const nombreCtrl = this.registroForm.controls['nombre'];
      const telefonoCtrl = this.registroForm.controls['telefono'];

      nombreCtrl.markAsTouched();
      telefonoCtrl.markAsTouched();

      if (nombreCtrl.invalid || telefonoCtrl.invalid) {
        return;
      }

      this.registroStep.set(2);
      return;
    }

    this.registroSubmitted = true;

    if (this.registroForm.invalid) {
      this.registroForm.markAllAsTouched();
      return;
    }

    const { nombre, email, telefono, password } = this.registroForm.value;
    this.loading.set(true);

    this.auth.register({ nombre, email, telefono, password }).subscribe({
      next: () => {
        this.loading.set(false);
        window.location.href = '/home';
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message ?? 'No se pudo crear la cuenta. Intenta de nuevo.');
      },
    });
  }

}
