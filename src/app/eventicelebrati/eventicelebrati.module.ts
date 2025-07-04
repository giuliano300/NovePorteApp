import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EventicelebratiPageRoutingModule } from './eventicelebrati-routing.module';

import { EventicelebratiPage } from './eventicelebrati.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EventicelebratiPageRoutingModule
  ],
  declarations: [EventicelebratiPage]
})
export class EventicelebratiPageModule {}
