import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteHeaderComponent } from '../shared/site-header.component';

interface MapLink { label: string; path: string; className: string; }
@Component({ selector: 'np-home', standalone: true, imports: [RouterLink, SiteHeaderComponent], templateUrl: './home.component.html', styleUrl: './home.component.scss' })
export class HomeComponent {
  readonly links: MapLink[] = [
    {label:'Arte',path:'/Forum/Dettaglio-Forum/Arte-1',className:'arte'},{label:'Donne',path:'/Forum/Dettaglio-Forum/Donne-2',className:'donne'},
    {label:'Nona Porta',path:'/Forum/Dettaglio-Forum/La-nona-porta-9',className:'nona-porta'},{label:'Tauromachia',path:'/Forum/Dettaglio-Forum/Tauromachia-3',className:'tauromachia'},
    {label:'Gioco',path:'/Forum/Dettaglio-Forum/Gioco-6',className:'gioco'},{label:'Fumo',path:'/Forum/Dettaglio-Forum/Fumo-5',className:'fumo'},
    {label:'Gola',path:'/Forum/Dettaglio-Forum/Gola-8',className:'gola'},{label:'Abbigliamento',path:'/Forum/Dettaglio-Forum/Abbigliamento-7',className:'abbigliamento'},
    {label:'Azione',path:'/Forum/Dettaglio-Forum/Azione-4',className:'azione'},{label:'Dandy',path:'/IlDandy',className:'dandy'},
    {label:'Registro',path:'/Registro',className:'registro'},{label:'Atti',path:'/Atti',className:'atti'},
    {label:'Panopticon',path:'/Panopticon/LePanoramiche',className:'panopticon'},{label:"Lettere all'Ordine",path:'/LettereOrdine',className:'lettere'},
    {label:'Salotto',path:'/SalottoLancillotto',className:'salotto'},{label:'Gran Maestro',path:'/Studio',className:'maestro'},
    {label:'Eventi',path:'/Eventi',className:'eventi'},
    {label:'Fornitori',path:'/Convenzioni',className:'fornitori'},{label:'Portico',path:'/Portico',className:'portico'}
  ];
}
