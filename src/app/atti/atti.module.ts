import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AttiPageRoutingModule } from './atti-routing.module';

import { AttiPage } from './atti.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AttiPageRoutingModule
  ],
  declarations: [AttiPage]
})
export class AttiPageModule {}
