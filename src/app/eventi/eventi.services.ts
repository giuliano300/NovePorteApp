import { ApiService } from '../../services/api.services';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EventiService {
  constructor(private ApiService: ApiService) {}

  getCurrentEvents() {
    return this.ApiService.getCurrentEvents();
  }

  getPastEvents() {
    return this.ApiService.getPastEvents();
  }

  getEvent(newsId: number) {
    return this.ApiService.getEvent(newsId);
  }
}
