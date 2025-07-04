import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ForumdetPageRoutingModule } from './forumdet-routing.module';

import { ForumdetPage } from './forumdet.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ForumdetPageRoutingModule,
    ReactiveFormsModule
  ],
  declarations: [ForumdetPage]
})
export class ForumdetPageModule {}
