import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { LuoghiPageRoutingModule } from './luoghi-routing.module';

import { LuoghiPage } from './luoghi.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    LuoghiPageRoutingModule
  ],
  declarations: [LuoghiPage]
})
export class LuoghiPageModule {}
