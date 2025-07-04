import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-fortezzadet',
  templateUrl: './fortezzadet.page.html',
  styleUrls: ['./fortezzadet.page.scss'],
})
export class FortezzadetPage  {

  constructor(private router: Router) { 
    if (localStorage.getItem("loggedIn") == null) {
      this.router.navigate(['fortezza']);
    } 
    
  }
  
}
