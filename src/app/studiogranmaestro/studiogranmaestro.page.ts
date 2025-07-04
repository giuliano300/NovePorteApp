import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-studiogranmaestro',
  templateUrl: './studiogranmaestro.page.html',
  styleUrls: ['./studiogranmaestro.page.scss'],
})
export class StudiogranmaestroPage implements OnInit {

  constructor(private router: Router) { }

  ngOnInit() { 
    localStorage.removeItem('forumsId');
    localStorage.removeItem('forumName');
  }

  gotoForum(id:number) {
    localStorage.setItem('forumsId', id.toString());
    localStorage.setItem('forumName', 'Scrivania del Gran Maestro');
    if(id === 11)
      localStorage.setItem('forumName', 'Posta del Gran Maestro');
      
    this.router.navigate(['forum']);
  }
}
