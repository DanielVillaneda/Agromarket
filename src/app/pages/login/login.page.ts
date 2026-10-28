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

type AuthMode = 'login' | 'registro' | 'recuperar';

function passwordsMatchValidatorFields(passwordField: string, confirmField: string) {
  return (group: AbstractControl): ValidationErrors | null => {
    const password = group.get(passwordField)?.value;
    const confirmPassword = group.get(confirmField)?.value;
    return password && confirmPassword && password !== confirmPassword ? { passwordsMismatch: true } : null;
  };
}

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
  // Botón de "ver contraseña" (ojo) en cada formulario; en el registro uno
  // solo muestra ambos campos para poder comparar que coincidan.
  readonly showLoginPassword = signal(false);
  readonly showRegistroPassword = signal(false);

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

  // --- Recuperar cuenta: correo -> código de 6 dígitos -> nueva contraseña ---
  readonly recuperarStep = signal<1 | 2 | 3>(1);
  readonly recuperarInfo = signal<string | null>(null);
  readonly showRecuperarPassword = signal(false);

  readonly recuperarForm: FormGroup = this.fb.group(
    {
      email: ['', [Validators.required, Validators.email]],
      code: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatchValidatorFields('password', 'confirmPassword') },
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

  get recuperarEmail() {
    return this.recuperarForm.controls['email'];
  }

  get recuperarCode() {
    return this.recuperarForm.controls['code'];
  }

  get recuperarPassword() {
    return this.recuperarForm.controls['password'];
  }

  get recuperarConfirmPassword() {
    return this.recuperarForm.controls['confirmPassword'];
  }

  setMode(mode: AuthMode): void {
    this.mode.set(mode);
    this.errorMessage.set(null);

    if (mode === 'registro') {
      this.registroStep.set(1);
    }

    if (mode === 'recuperar') {
      this.recuperarStep.set(1);
      this.recuperarInfo.set(null);
      this.recuperarForm.reset();
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

  /** Paso 1: pide el envío del código de 6 dígitos al correo ingresado. */
  onRecuperarEmailSubmit(): void {
    this.errorMessage.set(null);
    this.recuperarEmail.markAsTouched();

    if (this.recuperarEmail.invalid) {
      return;
    }

    this.loading.set(true);
    const email = this.recuperarEmail.value;

    this.auth.solicitarRecuperacion(email).subscribe({
      next: () => {
        this.loading.set(false);
        this.recuperarInfo.set(`Si ${email} está registrado, te enviamos un código de 6 dígitos (revisa también spam). Válido por 15 minutos.`);
        this.recuperarStep.set(2);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message ?? 'No se pudo enviar el código. Intenta de nuevo.');
      },
    });
  }

  /** Paso 2: valida el código antes de dejar definir la nueva contraseña. */
  onRecuperarCodeSubmit(): void {
    this.errorMessage.set(null);
    this.recuperarCode.markAsTouched();

    if (this.recuperarCode.invalid) {
      return;
    }

    this.loading.set(true);
    const { email, code } = this.recuperarForm.value;

    this.auth.verificarCodigoRecuperacion(email, code).subscribe({
      next: () => {
        this.loading.set(false);
        this.recuperarInfo.set(null);
        this.recuperarStep.set(3);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message ?? 'El código es inválido o expiró.');
      },
    });
  }

  /** Reenvía un nuevo código al mismo correo (ej. si expiró o no llegó). */
  onResendCode(): void {
    this.errorMessage.set(null);
    this.recuperarInfo.set(null);
    const email = this.recuperarForm.value.email;

    this.auth.solicitarRecuperacion(email).subscribe({
      next: () => this.recuperarInfo.set('Te enviamos un nuevo código.'),
      error: () => this.errorMessage.set('No se pudo reenviar el código. Intenta de nuevo.'),
    });
  }

  /** Paso 3: define la nueva contraseña (el backend vuelve a validar el código). */
  onRecuperarPasswordSubmit(): void {
    this.errorMessage.set(null);

    if (this.recuperarPassword.invalid || this.recuperarConfirmPassword.invalid || this.recuperarForm.hasError('passwordsMismatch')) {
      this.recuperarPassword.markAsTouched();
      this.recuperarConfirmPassword.markAsTouched();
      return;
    }

    this.loading.set(true);
    const { email, code, password } = this.recuperarForm.value;

    this.auth.restablecerPassword(email, code, password).subscribe({
      next: () => {
        this.loading.set(false);
        this.setMode('login');
        this.loginForm.patchValue({ email });
        this.recuperarInfo.set(null);
        this.errorMessage.set(null);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message ?? 'No se pudo actualizar la contraseña. Intenta de nuevo.');
      },
    });
  }

}
