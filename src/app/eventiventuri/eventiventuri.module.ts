import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EventiventuriPageRoutingModule } from './eventiventuri-routing.module';

import { EventiventuriPage } from './eventiventuri.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EventiventuriPageRoutingModule
  ],
  declarations: [EventiventuriPage]
})
export class EventiventuriPageModule {}
