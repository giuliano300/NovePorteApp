import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EventodetPageRoutingModule } from './eventodet-routing.module';

import { EventodetPage } from './eventodet.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EventodetPageRoutingModule
  ],
  declarations: [EventodetPage]
})
export class EventodetPageModule {}
