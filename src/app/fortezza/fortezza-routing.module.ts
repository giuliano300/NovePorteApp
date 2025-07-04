import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FortezzaPage } from './fortezza.page';

const routes: Routes = [
  {
    path: '',
    component: FortezzaPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FortezzaPageRoutingModule {}
