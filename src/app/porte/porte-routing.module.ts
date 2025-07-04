import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PortePage } from './porte.page';

const routes: Routes = [
  {
    path: '',
    component: PortePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PortePageRoutingModule {}
