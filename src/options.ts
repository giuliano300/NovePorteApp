import { HttpHeaders, HttpParams } from '@angular/common/http';

export class Options {
  headers?: HttpHeaders;
  observe?: any; // 'body' | 'events' | 'response'
  params?: HttpParams;
  reportProgress?: boolean;
  responseType?: any; // 'json' | 'arraybuffer' | 'blob' | 'text'
  withCredentials?: boolean;
  body?: any;
}
