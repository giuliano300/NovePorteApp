import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { StudiogranmaestroPageRoutingModule } from './studiogranmaestro-routing.module';

import { StudiogranmaestroPage } from './studiogranmaestro.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    StudiogranmaestroPageRoutingModule
  ],
  declarations: [StudiogranmaestroPage]
})
export class StudiogranmaestroPageModule {}
