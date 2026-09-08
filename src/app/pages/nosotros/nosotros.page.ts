import { Component } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular';
import { NavbarComponent } from '../../components/navbar/navbar.component';

@Component({
  selector: 'app-nosotros',
  templateUrl: './nosotros.page.html',
  styleUrls: ['./nosotros.page.scss'],
  imports: [IonContent, IonIcon, NavbarComponent],
})
export class NosotrosPage {}
