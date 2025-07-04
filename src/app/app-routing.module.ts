import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then( m => m.HomePageModule)
  },
  {
    path: 'porte',
    loadChildren: () => import('./porte/porte.module').then( m => m.PortePageModule)
  },
  {
    path: 'luoghi',
    loadChildren: () => import('./luoghi/luoghi.module').then( m => m.LuoghiPageModule)
  },
  {
    path: 'fortezza',
    loadChildren: () => import('./fortezza/fortezza.module').then( m => m.FortezzaPageModule)
  },
  {
    path: 'fortezzadet',
    loadChildren: () => import('./fortezzadet/fortezzadet.module').then( m => m.FortezzadetPageModule)
  },
  {
    path: 'dandy',
    loadChildren: () => import('./dandy/dandy.module').then( m => m.DandyPageModule)
  },
  {
    path: 'studiogranmaestro',
    loadChildren: () => import('./studiogranmaestro/studiogranmaestro.module').then( m => m.StudiogranmaestroPageModule)
  },
  {
    path: 'lettereordine',
    loadChildren: () => import('./lettereordine/lettereordine.module').then( m => m.LettereordinePageModule)
  },
  {
    path: 'registro',
    loadChildren: () => import('./registro/registro.module').then( m => m.RegistroPageModule)
  },
  {
    path: 'atti',
    loadChildren: () => import('./atti/atti.module').then( m => m.AttiPageModule)
  },
  {
    path: 'eventi',
    loadChildren: () => import('./eventi/eventi.module').then( m => m.EventiPageModule)
  },
  {
    path: 'eventicelebrati',
    loadChildren: () => import('./eventicelebrati/eventicelebrati.module').then( m => m.EventicelebratiPageModule)
  },
  {
    path: 'eventiventuri',
    loadChildren: () => import('./eventiventuri/eventiventuri.module').then( m => m.EventiventuriPageModule)
  },
  {
    path: 'eventodet',
    loadChildren: () => import('./eventodet/eventodet.module').then( m => m.EventodetPageModule)
  },
  {
    path: 'forum',
    loadChildren: () => import('./forum/forum.module').then( m => m.ForumPageModule)
  },
  {
    path: 'forumdet',
    loadChildren: () => import('./forumdet/forumdet.module').then( m => m.ForumdetPageModule)
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
