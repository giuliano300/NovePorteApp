import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FortezzaPageRoutingModule } from './fortezza-routing.module';

import { FortezzaPage } from './fortezza.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FortezzaPageRoutingModule
  ],
  declarations: [FortezzaPage]
})
export class FortezzaPageModule {}
