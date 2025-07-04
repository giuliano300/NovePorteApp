import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Options } from 'src/options';
import { email } from 'src/models/Email';
import { forumDataModel} from 'src/models/forumDataModel';

const env = environment.apiUrl;


@Injectable()
export class ApiService {
  constructor(protected http: HttpClient) {}

  getCurrentEvents(options?: Options): Observable<any> {
    const url = `${env}/News`;
    return this.http.get(url);
  }  
  getPastEvents(options?: Options): Observable<any> {
    let d = new Date().toJSON().slice(0,10).replace(/-/g,'/');
    const url = `${env}/News?data=${d}`;
    return this.http.get(url);
  }  
  
  getEvent(newsId: number, options?: Options): Observable<any> {
    const url = `${env}/News/${newsId}`;
    return this.http.get(url, options);
  } 
  
  login(code: string, options?: Options): Observable<any> {
    const url = `${env}/Fortezza/Login/${code}`;
    return this.http.get(url, options);
  }  

  search(prefix: string, options?: Options): Observable<any> {
    const url = `${env}/Soci?visibile=true&filtro=${prefix}`;
    return this.http.get(url, options);
  }

  sendEmail(email: email): Observable<any> {
    const url = `${env}/SendEmail`;
    return this.http.post(url,email);
  }

  getForums(idCategoria: number, idUtente?:number): Observable<any> {
    if(idUtente == undefined)
       idUtente = 0;
    const url = `${env}/Forum?IdCategoria=${idCategoria}&visibile=true&IdUtente=${idUtente}`;
    return this.http.get(url);
  }  
  
  getForum(forumId: number, options?: Options): Observable<any> {
    const url = `${env}/Forum/${forumId}`;
    return this.http.get(url, options);
  } 

  getCategorieForum(parentId: number, options?: Options): Observable<any> {
    const url = `${env}/CategorieForum?IdPadre=${parentId}&visibile=true`;
    return this.http.get(url, options);
  } 
  
  postForum(forumDataModel: forumDataModel): Observable<any> {
    const url = `${env}/Forum/NewToApp`;
    return this.http.post(url, forumDataModel);
  }

}