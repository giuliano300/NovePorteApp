import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ForumdetPage } from './forumdet.page';

const routes: Routes = [
  {
    path: '',
    component: ForumdetPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ForumdetPageRoutingModule {}
