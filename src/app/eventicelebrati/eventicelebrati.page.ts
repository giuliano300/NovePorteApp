import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EventiService } from '../eventi/eventi.services';
import { news } from '../../models/news';
@Component({
  selector: 'app-eventicelebrati',
  templateUrl: './eventicelebrati.page.html',
  styleUrls: ['./eventicelebrati.page.scss'],
})
export class EventicelebratiPage implements OnInit {
    preload: boolean = true;
    events: news[] = [];
    constructor(private router: Router,
      private eventiService: EventiService) { }
  
    ngOnInit() {
      this.getPastEvents();
    }
  
    getPastEvents() {
      this.events = [];
      this.eventiService.getPastEvents().subscribe(
        response => {
          this.preload = false;
          this.events = JSON.parse(JSON.stringify(response));
        },
        error => {
          console.log('oops', error);
        }
      );
    }
  
    gotoEvent(id: any) {
      localStorage.setItem('newsId', id);
      localStorage.setItem('type', 'old');
      this.router.navigate(['eventodet']);
    }
  }
  