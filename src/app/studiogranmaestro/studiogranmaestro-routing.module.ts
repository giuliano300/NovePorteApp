import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { StudiogranmaestroPage } from './studiogranmaestro.page';

const routes: Routes = [
  {
    path: '',
    component: StudiogranmaestroPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class StudiogranmaestroPageRoutingModule {}
