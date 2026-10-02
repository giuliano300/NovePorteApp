import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { LegacyPage, MemberDetail, MembersPage } from './members.models';

@Injectable({ providedIn: 'root' })
export class MembersApiService {
  private readonly http = inject(HttpClient);

  getPage(detail?: string | null, search = ''): Observable<MembersPage> {
    const suffix = detail ? `/${encodeURIComponent(detail)}` : '';
    const params = search.trim().length >= 2
      ? new HttpParams().set('search', search.trim())
      : undefined;
    return this.http.get<MembersPage>(`/api/site/members${suffix}`, { params });
  }

  getMember(id: number): Observable<MemberDetail> {
    return this.http.get<MemberDetail>(`/api/site/members/member/${id}`);
  }

  getLegacyHome(): Observable<LegacyPage> {
    return this.http.get<LegacyPage>('/api/private-content', {
      params: new HttpParams().set('path', '/Soci')
    });
  }
}
