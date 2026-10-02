import { CommonModule } from '@angular/common';
import { Component, DestroyRef, HostListener, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { combineLatest, finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SiteHeaderComponent } from '../../shared/site-header.component';
import { MembersApiService } from './members-api.service';
import { MemberDetail, MemberSummary, MembersPage } from './members.models';

type MembersMode = 'home' | 'list' | 'search' | 'member';

@Component({
  selector: 'np-members',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SiteHeaderComponent],
  templateUrl: './members.component.html',
  styleUrl: './members.component.scss'
})
export class MembersComponent implements OnInit {
  private readonly api = inject(MembersApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroyRef = inject(DestroyRef);

  readonly page = signal<MembersPage | null>(null);
  readonly member = signal<MemberDetail | null>(null);
  readonly legacyHome = signal<SafeHtml>('');
  readonly mode = signal<MembersMode>('home');
  readonly loading = signal(true);
  readonly error = signal('');
  search = '';
  appliedSearch = '';
  selectedPrefecture = '';

  ngOnInit(): void {
    combineLatest([this.route.url, this.route.paramMap, this.route.queryParamMap, this.route.data])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([segments, params, query, data]) => {
        const path = (segments[0]?.path || 'Soci').toLocaleLowerCase('it');
        this.search = query.get('search') || '';
        this.appliedSearch = this.search;
        this.selectedPrefecture = '';
        this.member.set(null);
        this.page.set(null);

        if (path === 'socio') {
          this.mode.set('member');
          this.loadMember(Number(query.get('Id') || query.get('id')));
          return;
        }

        let detail = data['membersDetail'] as string | undefined;
        if (path === 'prefettura') {
          const id = Number(query.get('Id') || query.get('id'));
          detail = id > 0 ? `prefettura-${id}` : undefined;
        } else if (path === 'soci') {
          detail = params.get('detail') || undefined;
        }

        this.mode.set(path === 'ricercasocio' ? 'search' : detail ? 'list' : 'home');
        this.loadPage(detail, this.mode() === 'search' ? this.appliedSearch : '');
      });
  }

  @HostListener('click', ['$event'])
  handleLegacyHome(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target?.closest('.np-legacy-soci-home')) return;
    const searchAction = target.closest<HTMLAnchorElement>('[data-members-search]');
    if (searchAction) {
      event.preventDefault();
      const input = document.querySelector<HTMLInputElement>('.np-legacy-soci-home .socio-filtri input');
      const value = input?.value.trim() || '';
      void this.router.navigate(['/RicercaSocio'], { queryParams: value ? { search: value } : {} });
    }
  }

  applyFilters(): void {
    this.appliedSearch = this.search.trim();
    if (this.mode() === 'search') {
      void this.router.navigate(['/RicercaSocio'], { queryParams: this.appliedSearch ? { search: this.appliedSearch } : {} });
    }
  }

  filteredMembers(): MemberSummary[] {
    const current = this.page();
    if (!current) return [];
    const term = this.appliedSearch.toLocaleLowerCase('it');
    return current.members.filter(item => {
      const matchesText = !term || `${item.name} ${item.surname}`.toLocaleLowerCase('it').includes(term);
      const matchesPrefecture = !this.selectedPrefecture || item.prefecture === this.selectedPrefecture;
      return matchesText && matchesPrefecture;
    });
  }

  goBack(): void { history.back(); }

  memberPhoto(value: string, memberId: number): string {
    const name = (value || '').trim();
    if (!name) return '/api/private-asset?path=%2FPublic%2FFotoSoci%2FFotoNonDisponibile.jpg';
    if (/^https?:\/\//i.test(name)) return name;
    if (name.startsWith('/uploads/')) return this.appAsset(name);
    if (new RegExp(`^${memberId}_(?:[123]_|profilo_)?\\d{14}\\.(?:jpe?g|png|webp)$`, 'i').test(name))
      return this.appAsset(`/uploads/soci/${encodeURIComponent(name)}`);
    return `/api/private-asset?path=${encodeURIComponent(`/Public/FotoSoci/${name}`)}`;
  }

  officialPhoto(value: string): string {
    const name = (value || '').trim();
    if (!name) return '/assets/logo-porta.png';
    if (/^https?:\/\//i.test(name)) return name;
    if (name.startsWith('/')) return this.appAsset(name);
    return /^member-\d+-/i.test(name)
      ? this.appAsset(`/uploads/prefectures/members/${encodeURIComponent(name)}`)
      : `/api/private-asset?path=${encodeURIComponent(`/Public/UtentiPrefetture/${name}`)}`;
  }

  crest(value: string): string {
    const name = (value || '').trim();
    if (!name) return '';
    if (/^https?:\/\//i.test(name)) return name;
    if (name.startsWith('/')) return this.appAsset(name);
    return /^prefecture-\d+-/i.test(name)
      ? this.appAsset(`/uploads/prefectures/crests/${encodeURIComponent(name)}`)
      : `/api/private-asset?path=${encodeURIComponent(`/Public/StemmiPrefetture/${name}`)}`;
  }

  imageFallback(event: Event): void {
    const image = event.target as HTMLImageElement;
    if (image.dataset['fallback']) return;
    image.dataset['fallback'] = 'true';
    image.src = '/assets/logo-porta.png';
  }

  detailSections(value: MemberDetail): Array<[string, string]> {
    return [
      ['TITOLI NOBILIARI', value.nobleTitles], ['ATTIVITÀ', value.activity],
      ['LIBERE INIZIATIVE', value.freeInitiatives], ['SPORT', value.sport], ['INTERESSI', value.interests],
      ['IO SONO', value.iAm], ['IO NON SONO', value.iAmNot], ['I MIEI MITI', value.myths],
      ['I MIEI GUSTI', value.tastes], ['I MIEI NEMICI', value.enemies],
      ['I MIEI MAESTRI', value.masters], ['UN MOTTO', value.motto]
    ].filter(section => Boolean(section[1]?.trim())) as Array<[string, string]>;
  }

  private loadPage(detail?: string, search = ''): void {
    this.loading.set(true);
    this.error.set('');
    this.api.getPage(detail, search).pipe(finalize(() => this.loading.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: page => { this.page.set(page); if (this.mode() === 'home') this.loadLegacyHome(page); },
      error: error => this.fail(error)
    });
  }

  private loadMember(id: number): void {
    if (!Number.isInteger(id) || id <= 0) {
      this.loading.set(false); this.error.set('La scheda del socio richiesta non è valida.'); return;
    }
    this.loading.set(true);
    this.error.set('');
    this.api.getMember(id).pipe(finalize(() => this.loading.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: member => this.member.set(member), error: error => this.fail(error)
    });
  }

  private loadLegacyHome(page: MembersPage): void {
    this.api.getLegacyHome().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(({ html }) => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      for (const anchor of Array.from(doc.querySelectorAll<HTMLAnchorElement>('a[href]')))
        anchor.href = anchor.getAttribute('href')?.replace(/\.aspx(?=([?#]|$))/i, '') || '#';
      const search = doc.querySelector<HTMLAnchorElement>('.socio-filtri a');
      if (search) { search.href = '#'; search.dataset['membersSearch'] = 'true'; }

      const heading = Array.from(doc.querySelectorAll('h3')).find(node => node.textContent?.trim().toLocaleLowerCase('it') === 'prefetture');
      const prefRow = heading?.closest('.row');
      if (prefRow) {
        prefRow.querySelectorAll('.btn-soci').forEach(node => node.parentElement?.remove());
        for (const prefecture of page.prefectures) {
          const column = doc.createElement('div');
          column.className = 'col-lg-3 col-md-3 col-sm-6 padding-left-rigth-10';
          column.innerHTML = `<div class="btn-soci"><a href="/Prefettura?Id=${prefecture.id}">${this.escape(prefecture.name)}</a></div>`;
          prefRow.appendChild(column);
        }
      }
      this.legacyHome.set(this.sanitizer.bypassSecurityTrustHtml(doc.body.innerHTML));
    });
  }

  private escape(value: string): string {
    const node = document.createElement('span'); node.textContent = value; return node.innerHTML;
  }

  private appAsset(path: string): string {
    return `/api/site/app-asset?path=${encodeURIComponent(path)}`;
  }

  private fail(error: { status?: number }): void {
    this.page.set(null); this.member.set(null);
    this.error.set(error.status === 401 ? 'Acceda nuovamente alla Fortezza per consultare il Libro Soci.'
      : error.status === 404 ? 'La scheda richiesta non è disponibile.' : 'Il Libro Soci non è al momento disponibile.');
  }
}
