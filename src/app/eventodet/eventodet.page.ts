import { Component, OnInit, OnDestroy } from '@angular/core';
import { EventiService } from '../eventi/eventi.services';
import { news } from 'src/models/news';

@Component({
  selector: 'app-eventodet',
  templateUrl: './eventodet.page.html',
  styleUrls: ['./eventodet.page.scss'],
})
export class EventodetPage implements OnInit, OnDestroy {
  event = new news;
  type:boolean = true;
  preload: boolean = true;
  constructor(private eventiService: EventiService) { }

  ngOnInit() {
    let newsId = localStorage.getItem('newsId');
    this.getEvent(newsId);

    if(localStorage.getItem("type")=="old")
      this.type = false; 

  }
  ngOnDestroy() {
    localStorage.removeItem('newsId');
    localStorage.removeItem('type');
  }

  getEvent(newsId: any) {
    this.eventiService.getEvent(newsId).subscribe(
      response => {
        this.preload = false;
        this.event = JSON.parse(JSON.stringify(response));
      },
      error => {
        console.log('oops', error);
      }
    );
  }
}
