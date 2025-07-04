import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LuoghiPage } from './luoghi.page';

const routes: Routes = [
  {
    path: '',
    component: LuoghiPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LuoghiPageRoutingModule {}
