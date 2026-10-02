import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { PageComponent } from './page/page.component';
import { FortezzaLoginComponent } from './fortezza/fortezza-login.component';
import { FortezzaEntranceComponent } from './fortezza/fortezza-entrance.component';
import { FortezzaComponent } from './fortezza/fortezza.component';
import { fortezzaGuard } from './fortezza/fortezza.guard';
import { MembersComponent } from './dynamic/members/members.component';
import { ProductCategoriesComponent } from './dynamic/products/product-categories.component';
import { ProductsListComponent } from './dynamic/products/products-list.component';
import { ProductDetailComponent } from './dynamic/products/product-detail.component';

const privatePageMatcher = (segments: import('@angular/router').UrlSegment[]) => {
  const path = segments.map(segment => segment.path).join('/');
  return /^(Soci|Socio|Convenzioni|RegistroConvenzioni(?:\.aspx)?|AttiInterni|PersonalArea|RichiestaModificaDati(?:\.aspx)?|RicercaSocio|TipoSociPage|Scudieri-\d+|Cavalieri-\d+|Guardiani-\d+|Fondatori-\d+|Mecenati-\d+|Prefettura|CalendarioEventi)$/i.test(path)
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
  { path: 'Soci', component: MembersComponent, canActivate: [fortezzaGuard], title: 'Libro Soci | Nove Porte' },
  { path: 'Soci/:detail', component: MembersComponent, canActivate: [fortezzaGuard], title: 'Libro Soci | Nove Porte' },
  { path: 'RicercaSocio', component: MembersComponent, canActivate: [fortezzaGuard], title: 'Ricerca Socio | Nove Porte' },
  { path: 'Scudieri-4', component: MembersComponent, canActivate: [fortezzaGuard], data: { membersDetail: 'scudieri' }, title: 'Scudieri | Nove Porte' },
  { path: 'Cavalieri-2', component: MembersComponent, canActivate: [fortezzaGuard], data: { membersDetail: 'cavalieri' }, title: 'Cavalieri | Nove Porte' },
  { path: 'Guardiani-3', component: MembersComponent, canActivate: [fortezzaGuard], data: { membersDetail: 'guardiani' }, title: 'Guardiani | Nove Porte' },
  { path: 'Fondatori-1', component: MembersComponent, canActivate: [fortezzaGuard], data: { membersDetail: 'fondatori' }, title: 'Fondatori | Nove Porte' },
  { path: 'Mecenati-5', component: MembersComponent, canActivate: [fortezzaGuard], data: { membersDetail: 'mecenati' }, title: 'Mecenati | Nove Porte' },
  { path: 'Prefettura', component: MembersComponent, canActivate: [fortezzaGuard], title: 'Prefettura | Nove Porte' },
  { path: 'Socio', component: MembersComponent, canActivate: [fortezzaGuard], title: 'Socio | Nove Porte' },
  { path: 'CategorieOggetti', component: ProductCategoriesComponent, canActivate: [fortezzaGuard], title: 'Categorie | Nove Porte' },
  { path: 'Oggetti', component: ProductsListComponent, canActivate: [fortezzaGuard], title: 'Oggetti | Nove Porte' },
  { path: 'Oggetto', component: ProductDetailComponent, canActivate: [fortezzaGuard], title: 'Oggetto | Nove Porte' },
  { matcher: privatePageMatcher, component: PageComponent, canActivate: [fortezzaGuard] },
  { path: '**', component: PageComponent }
];
