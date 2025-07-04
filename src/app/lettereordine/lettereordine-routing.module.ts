import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LettereordinePage } from './lettereordine.page';

const routes: Routes = [
  {
    path: '',
    component: LettereordinePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LettereordinePageRoutingModule {}
