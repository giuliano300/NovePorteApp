import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EventiventuriPage } from './eventiventuri.page';

const routes: Routes = [
  {
    path: '',
    component: EventiventuriPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EventiventuriPageRoutingModule {}
