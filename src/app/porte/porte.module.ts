import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PortePageRoutingModule } from './porte-routing.module';

import { PortePage } from './porte.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PortePageRoutingModule
  ],
  declarations: [PortePage]
})
export class PortePageModule {}
