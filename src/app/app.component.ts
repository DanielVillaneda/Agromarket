import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { IonApp, IonRouterOutlet } from '@ionic/angular';
import { filter, map } from 'rxjs';
import { TabBarComponent } from './components/tab-bar/tab-bar.component';

/** Pantallas a pantalla completa donde no se muestra la barra de pestañas. */
const ROUTES_WITHOUT_TAB_BAR = ['/login', '/registro'];

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [IonApp, IonRouterOutlet, TabBarComponent],
})
export class AppComponent {

  private readonly router = inject(Router);

  readonly showTabBar = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => !ROUTES_WITHOUT_TAB_BAR.some((route) => event.urlAfterRedirects.startsWith(route))),
    ),
    { initialValue: false },
  );

}
