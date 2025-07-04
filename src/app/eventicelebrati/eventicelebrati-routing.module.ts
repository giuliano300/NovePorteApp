import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EventicelebratiPage } from './eventicelebrati.page';

const routes: Routes = [
  {
    path: '',
    component: EventicelebratiPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EventicelebratiPageRoutingModule {}
