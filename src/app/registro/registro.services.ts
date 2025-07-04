import { ApiService } from '../../services/api.services';
import { Injectable } from '@angular/core';
import { email } from 'src/models/Email';

@Injectable({
  providedIn: 'root'
})
export class RegistroService {
  constructor(private ApiService: ApiService) {}

  sendEmail(email: email) {
    return this.ApiService.sendEmail(email);
  }
}
