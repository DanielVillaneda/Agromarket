import { Component, OnInit } from '@angular/core';
import { IonIcon } from '@ionic/angular';


@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  imports: [IonIcon],
})
export class FooterComponent  implements OnInit {

  constructor() { }

  ngOnInit() {}

}
