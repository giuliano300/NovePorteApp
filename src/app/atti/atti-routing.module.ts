import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AttiPage } from './atti.page';

const routes: Routes = [
  {
    path: '',
    component: AttiPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AttiPageRoutingModule {}
