import { ApiService } from '../../services/api.services';
import { Injectable } from '@angular/core';
import { forumDataModel} from '../../models/forumDataModel';

@Injectable({
  providedIn: 'root'
})
export class ForumService {
  constructor(private ApiService: ApiService) {}

  getForums(idCategoria: number) {
    return this.ApiService.getForums(idCategoria);
  }

  getForum(forumId: number) {
    return this.ApiService.getForum(forumId);
  }
  
  getCategorieForum(parentId: number) {
    return this.ApiService.getCategorieForum(parentId);
  }
 
  postNewForum(forumDataModel: forumDataModel) {
    return this.ApiService.postForum(forumDataModel);
  }
}
