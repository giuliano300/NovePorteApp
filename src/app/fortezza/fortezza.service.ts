import { ApiService } from '../../services/api.services';
import { Inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FortezzaService {
  constructor(private apiService: ApiService) {
  }

  login(code: string) {
    return this.apiService.login(code);
  }
}
