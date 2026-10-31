import { Component, signal } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular';
import { NavbarComponent } from '../../components/navbar/navbar.component';

interface FaqItem {
  question: string;
  answer: string;
}

@Component({
  selector: 'app-ayuda',
  templateUrl: './ayuda.page.html',
  styleUrls: ['./ayuda.page.scss'],
  imports: [IonContent, IonIcon, NavbarComponent],
})
export class AyudaPage {

  readonly faqs: FaqItem[] = [
    {
      question: '¿Cómo compro un producto?',
      answer:
        'Entra al producto que te interesa, elige la cantidad (y la unidad, si se vende por peso) y agrégalo al carrito. También puedes agregarlo directo desde el botón del carrito en cada tarjeta. Cuando termines, ve al carrito y confirma la compra.',
    },
    {
      question: '¿Cómo publico un producto para vender?',
      answer:
        'Inicia sesión, ve a "Vender" y completa el formulario con nombre, precio, cantidad disponible, ubicación, descripción y al menos una foto. Puedes editarlo o eliminarlo después desde "Mis productos en venta".',
    },
    {
      question: '¿Qué método de pago se usa?',
      answer:
        'Puedes registrar un método de pago en tu Perfil (banco, titular y los últimos 4 dígitos de tu tarjeta) para que quede asociado a tus compras en tu historial. AgroMarket no procesa cobros en línea: el pago se acuerda directamente entre comprador y vendedor.',
    },
    {
      question: 'Olvidé mi contraseña, ¿qué hago?',
      answer:
        'En la pantalla de inicio de sesión, toca "¿Olvidaste tu contraseña?". Te enviaremos un código de 6 dígitos a tu correo registrado, válido por 15 minutos, para que definas una nueva contraseña.',
    },
    {
      question: '¿Cómo contacto al vendedor de un producto?',
      answer: 'En la página de cada producto encuentras el nombre y los datos de contacto del vendedor para coordinar la entrega directamente.',
    },
  ];

  readonly openIndex = signal<number | null>(0);

  toggle(index: number): void {
    this.openIndex.update((current) => (current === index ? null : index));
  }

}
