import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-porte',
  templateUrl: './porte.page.html',
  styleUrls: ['./porte.page.scss'],
})
export class PortePage  {

  constructor(private router: Router) { }

  gotoForums(id:number, name:string){
    localStorage.setItem('forumsId', id.toString());
    localStorage.setItem('forumName', name);
    this.router.navigate(['forum']);
  }
}
