import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { PageComponent } from './page/page.component';
import { FortezzaLoginComponent } from './fortezza/fortezza-login.component';
import { FortezzaEntranceComponent } from './fortezza/fortezza-entrance.component';
import { FortezzaComponent } from './fortezza/fortezza.component';
import { fortezzaGuard } from './fortezza/fortezza.guard';

const privatePageMatcher = (segments: import('@angular/router').UrlSegment[]) => {
  const path = segments.map(segment => segment.path).join('/');
  return /^(Soci|Socio|Convenzioni|RegistroConvenzioni(?:\.aspx)?|AttiInterni|CategorieOggetti|Oggetti|Oggetto|PersonalArea|RichiestaModificaDati(?:\.aspx)?|RicercaSocio|TipoSociPage|Scudieri-\d+|Cavalieri-\d+|Guardiani-\d+|Fondatori-\d+|Mecenati-\d+|Prefettura|CalendarioEventi)$/i.test(path)
    ? { consumed: segments }
    : null;
};

export const routes: Routes = [
  { path: '', component: HomeComponent, title: 'Cittadella | Nove Porte' },
  { path: 'Default', redirectTo: '', pathMatch: 'full' },
  { path: 'Arte.aspx', redirectTo: 'Arte', pathMatch: 'full' },
  { path: 'Donne.aspx', redirectTo: 'Donne', pathMatch: 'full' },
  { path: 'Tauromachia.aspx', redirectTo: 'Tauromachia', pathMatch: 'full' },
  { path: 'Fortezza', component: FortezzaEntranceComponent, title: 'Fortezza | Nove Porte' },
  { path: 'FortezzaCode', component: FortezzaLoginComponent, title: 'Accesso Fortezza | Nove Porte' },
  { path: 'FortezzaCode.aspx', redirectTo: 'FortezzaCode', pathMatch: 'full' },
  { path: 'FortezzaDet', component: FortezzaComponent, canActivate: [fortezzaGuard], title: 'Fortezza | Nove Porte' },
  { path: 'FortezzaDet.aspx', redirectTo: 'FortezzaDet', pathMatch: 'full' },
  { matcher: privatePageMatcher, component: PageComponent, canActivate: [fortezzaGuard] },
  { path: '**', component: PageComponent }
];
