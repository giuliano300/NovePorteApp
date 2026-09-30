import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay, switchMap } from 'rxjs';

export interface ImportedPage { path: string; title: string; html: string; }
interface ManifestEntry { path: string; title: string; file: string; }
interface Manifest { pages: Record<string, ManifestEntry>; }

@Injectable({ providedIn: 'root' })
export class ContentService {
  private readonly http = inject(HttpClient);
  private readonly manifest$ = this.http.get<Manifest>('/content/manifest.json').pipe(shareReplay(1));

  private canonicalPath(path: string): string {
    const pathname = path.split('?')[0];
    try {
      return decodeURIComponent(pathname).toLocaleLowerCase('it');
    } catch {
      return pathname.toLocaleLowerCase('it');
    }
  }

  get(path: string): Observable<ImportedPage | null> {
    if (/^\/(Soci|Socio(?:\?|$)|Convenzioni|RegistroConvenzioni|AttiInterni|CategorieOggetti|Oggetti(?:\?|$)|Oggetto(?:\?|$)|PersonalArea|RichiestaModificaDati|RicercaSocio|TipoSociPage|Scudieri-|Cavalieri-|Guardiani-|Fondatori-|Mecenati-|Prefettura(?:\?|$)|CalendarioEventi)/i.test(path)) {
      return this.http.get<ImportedPage>('/api/private-content', { params: { path } });
    }
    return this.manifest$.pipe(
      map(manifest => {
        const pathname = path.split('?')[0];
        const normalized = pathname.toLowerCase();
        return manifest.pages[path.toLowerCase()]
          || manifest.pages[normalized]
          || manifest.pages[`${normalized}.aspx`]
          || Object.values(manifest.pages).find(entry => this.canonicalPath(entry.path) === this.canonicalPath(pathname))
          || null;
      }),
      switchMap(entry => entry
        ? this.http.get<ImportedPage>(`/content/pages/${entry.file}`).pipe(
            map(page => ({
              ...page,
              html: page.html.replace(/href=(['"])(\/[^'"?#]+)\.aspx(?=([?#]|\1))/gi, 'href=$1$2')
            }))
          )
        : [null])
    );
  }
}
