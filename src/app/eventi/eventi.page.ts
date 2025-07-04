import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EventiService } from './eventi.services';
import { news } from '../../models/news';

@Component({
  selector: 'app-eventi',
  templateUrl: './eventi.page.html',
  styleUrls: ['./eventi.page.scss'],
})
export class EventiPage implements OnInit {
  events: news[] = [];
  preload: boolean = true;
  constructor(private router: Router,
    private eventiService: EventiService) { }

  ngOnInit() {
    this.getCurrentEvents();
  }

  getCurrentEvents() {
    this.events = [];
    this.eventiService.getCurrentEvents().subscribe(
      response => {
        this.preload = false;
        this.events = JSON.parse(JSON.stringify(response));
      },
      error => {
        console.log('oops', error);
      }
    );
  }

  gotoEvent(id:number) {
    localStorage.setItem('newsId', id.toString());
    localStorage.setItem('type', 'new');
    this.router.navigate(['eventodet']);
  }
}
