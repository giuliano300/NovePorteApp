import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DandyPageRoutingModule } from './dandy-routing.module';

import { DandyPage } from './dandy.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DandyPageRoutingModule
  ],
  declarations: [DandyPage]
})
export class DandyPageModule {}
