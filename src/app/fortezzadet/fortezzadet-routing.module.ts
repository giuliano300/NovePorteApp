import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FortezzadetPage } from './fortezzadet.page';

const routes: Routes = [
  {
    path: '',
    component: FortezzadetPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FortezzadetPageRoutingModule {}
