import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FortezzadetPageRoutingModule } from './fortezzadet-routing.module';

import { FortezzadetPage } from './fortezzadet.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FortezzadetPageRoutingModule
  ],
  declarations: [FortezzadetPage]
})
export class FortezzadetPageModule {}
