import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { LettereordinePageRoutingModule } from './lettereordine-routing.module';

import { LettereordinePage } from './lettereordine.page';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    LettereordinePageRoutingModule,
    ReactiveFormsModule
  ],
  declarations: [LettereordinePage]
})
export class LettereordinePageModule {}
