import { Component, HostListener, OnDestroy, ViewEncapsulation, inject, signal } from '@angular/core';
import { DomSanitizer, SafeHtml, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription, catchError, combineLatest, map, of, switchMap } from 'rxjs';
import { SiteHeaderComponent } from '../shared/site-header.component';
import { ContentService } from './content.service';

interface SidebarCalendarEvent {
  date: string;
  href: string;
  title: string;
  place?: string;
}

@Component({ selector: 'np-page', standalone: true, imports: [RouterLink, SiteHeaderComponent], templateUrl: './page.component.html', styleUrl: './page.component.scss', encapsulation: ViewEncapsulation.None })
export class PageComponent implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly contentService = inject(ContentService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly documentTitle = inject(Title);
  private forumCategoryFilter = '';
  private forumSearchFilter = '';
  private calendarEvents: SidebarCalendarEvent[] = [];
  private calendarEventsPromise?: Promise<SidebarCalendarEvent[]>;
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly pageTitle = signal('Nove Porte');
  readonly content = signal<SafeHtml>('');
  readonly showPersonalArea = signal(false);
  private readonly subscription: Subscription;

  constructor() {
    this.subscription = combineLatest([this.route.url, this.route.queryParamMap]).pipe(
      map(([segments]) => {
        const path = `/${segments.map(segment => segment.path).join('/')}${location.search}`;
        this.forumCategoryFilter = '';
        this.forumSearchFilter = '';
        this.showPersonalArea.set(/^\/(Soci|Socio(?:\?|$)|Convenzioni|RegistroConvenzioni|AttiInterni|CategorieOggetti|Oggetti(?:\?|$)|Oggetto(?:\?|$)|PersonalArea|RichiestaModificaDati|RicercaSocio|TipoSociPage|Scudieri-|Cavalieri-|Guardiani-|Fondatori-|Mecenati-|Prefettura(?:\?|$)|CalendarioEventi)/i.test(path));
        return path;
      }),
      switchMap(path => this.contentService.get(path).pipe(catchError(() => of(null))))
    ).subscribe(page => {
      this.loading.set(false);
      this.error.set(!page);
      if (page) {
        this.pageTitle.set(page.title);
        this.documentTitle.setTitle(`${page.title} | Nove Porte`);
        this.content.set(this.sanitizer.bypassSecurityTrustHtml(page.html));
        this.scheduleFragmentScroll(this.route.snapshot.fragment);
        requestAnimationFrame(() => requestAnimationFrame(() => {
          this.initializeImportedPage();
          this.restoreForumFilters();
        }));
      }
    });
    this.subscription.add(this.route.fragment.subscribe(fragment => this.scheduleFragmentScroll(fragment)));
  }

  private scheduleFragmentScroll(fragment: string | null, updateUrl = false): void {
    if (!fragment) return;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      let name = fragment;
      try { name = decodeURIComponent(fragment); } catch { /* use the literal fragment */ }
      const destination = document.getElementById(name) || document.getElementsByName(name)[0];
      destination?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (destination && updateUrl) {
        history.replaceState(history.state, '', `${location.pathname}${location.search}#${fragment}`);
      }
    }));
  }

  @HostListener('click', ['$event'])
  handleImportedNavigation(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    if (!target.closest('.menu-dandy, .menu-dandy-mobile')) {
      document.querySelectorAll<HTMLElement>('.dandy-menu-open').forEach(submenu => submenu.classList.remove('dandy-menu-open'));
      document.querySelectorAll<HTMLElement>('.menu-dandy li[aria-expanded="true"], .menu-dandy-mobile li[aria-expanded="true"]')
        .forEach(item => item.setAttribute('aria-expanded', 'false'));
    }

    const importedContent = target.closest('.imported-content');
    if (!importedContent) return;

    const searchButton = target.closest<HTMLInputElement>('.ricerca-forum input[type="submit"]');
    if (searchButton) {
      event.preventDefault();
      const search = importedContent.querySelector<HTMLInputElement>('.ricerca-forum input[type="text"]');
      this.forumSearchFilter = search?.value.trim() || '';
      if (!importedContent.querySelector('.contain-forum .forum-thumb')) {
        void this.router.navigateByUrl(`${this.forumParentPath()}?cerca=${encodeURIComponent(this.forumSearchFilter)}`);
        return;
      }
      this.applyForumFilters(importedContent);
      return;
    }

    const anchor = target.closest<HTMLAnchorElement>('a');
    if (anchor) {
      const href = anchor.getAttribute('href');
      const calendarAction = anchor.dataset['calendarAction'];
      if (calendarAction) {
        event.preventDefault();
        const panel = anchor.closest<HTMLElement>('[data-np-sidebar-calendar]');
        if (panel) this.changeSidebarCalendar(panel, calendarAction);
        return;
      }
      if (anchor.classList.contains('Risposte')) {
        event.preventDefault();
        anchor.closest('.add-commento')?.querySelector<HTMLElement>('.form-add-intervento')?.classList.toggle('forum-intervention-open');
        return;
      }
      if (anchor.classList.contains('Risposta')) {
        event.preventDefault();
        const replyId = anchor.id.replace(/^Risposta-/, '');
        document.getElementById(`form-add-risposta-${replyId}`)?.classList.toggle('forum-reply-open');
        return;
      }
      if (!href || anchor.target === '_blank' || /^(mailto:|tel:|https?:\/\/)/i.test(href)) return;

      if (href === '#') {
        event.preventDefault();
        if (anchor.closest('#DataPagerProducts')) {
          const page = Number((anchor.textContent || '').trim());
          if (Number.isInteger(page) && page > 0) {
            window.scrollTo({ top: 0, behavior: 'auto' });
            void this.router.navigateByUrl(page === 1 ? location.pathname : `${location.pathname}?pagina=${page}`);
          }
          return;
        }

        if (anchor.closest('.btn-porta')) {
          void this.router.navigateByUrl('/NonaPorta');
          return;
        }

        const category = anchor.closest('.container-sotto-categorie .container-link');
        if (category) {
          this.forumCategoryFilter = (anchor.textContent || '').trim();
          if (!importedContent.querySelector('.contain-forum .forum-thumb')) {
            void this.router.navigateByUrl(`${this.forumParentPath()}?categoria=${encodeURIComponent(this.forumCategoryFilter)}`);
            return;
          }
          category.parentElement?.querySelectorAll('.container-link').forEach(item => item.classList.remove('forum-category-active'));
          category.classList.add('forum-category-active');
          this.applyForumFilters(importedContent);
          return;
        }

        if (/^torni?\s+a\s+/i.test((anchor.textContent || '').trim()) || /LnkBack$/i.test(anchor.id)) {
          void this.router.navigateByUrl(this.forumParentPath());
          return;
        }

        if (anchor.closest('.btn-back-salotto, .back-forum') || /torn[ai] indietro|va(?:i|da) al forum/i.test(anchor.textContent || '')) {
          history.back();
        }
        return;
      }

      if (href.startsWith('#')) {
        event.preventDefault();
        this.scheduleFragmentScroll(href.slice(1), true);
        return;
      }

      if (href.startsWith('/')) {
        event.preventDefault();
        void this.router.navigateByUrl(href.replace(/\.aspx(?=([?#]|$))/i, ''));
      }
      return;
    }

    const galleryLetter = target.closest<HTMLElement>('.link-galleria span');
    if (galleryLetter) {
      const letter = Array.from(galleryLetter.classList).find(value => /^[a-z]$/i.test(value));
      const destination = letter
        ? importedContent.querySelector<HTMLElement>(`.galleria-result .result-${letter.toLowerCase()}`)
        : null;
      destination?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    if (target.closest('.back-forum')) {
      history.back();
      return;
    }

    const menu = target.closest<HTMLElement>('.menu-dandy, .menu-dandy-mobile');
    const item = target.closest<HTMLLIElement>('li');
    if (!menu || !item) return;

    const items = Array.from(menu.querySelectorAll<HTMLLIElement>(':scope > ul > li'));
    const index = items.indexOf(item);
    if (index === 0) {
      const submenu = menu.querySelector<HTMLElement>('.sub-menu-dandy, .sub-menu-dandy-mobile');
      submenu?.classList.toggle('dandy-menu-open');
      item.setAttribute('aria-expanded', String(submenu?.classList.contains('dandy-menu-open') ?? false));
      return;
    }

    const destinations = ['/IlDandy', '/Dandy/Contemporanei', '/Dandy/Galleria', '/Dandy/Immaginari'];
    const destination = destinations[index];
    if (destination) void this.router.navigateByUrl(destination);
  }

  @HostListener('keydown', ['$event'])
  handleImportedSearch(event: KeyboardEvent): void {
    if (event.key !== 'Enter') return;
    const target = event.target as HTMLInputElement | null;
    if (!target?.matches('.imported-content .ricerca-forum input[type="text"]')) return;
    const importedContent = target.closest<HTMLElement>('.imported-content');
    if (!importedContent) return;
    event.preventDefault();
    this.forumSearchFilter = target.value.trim();
    this.applyForumFilters(importedContent);
  }

  private applyForumFilters(importedContent: Element): void {
    const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('it');
    const category = normalize(this.forumCategoryFilter);
    const search = normalize(this.forumSearchFilter);
    const cards = Array.from(importedContent.querySelectorAll<HTMLElement>('.contain-forum .forum-thumb'));

    for (const card of cards) {
      const text = normalize(card.textContent || '');
      const categoryText = normalize(card.querySelector('section')?.textContent || '');
      card.hidden = Boolean((category && !categoryText.includes(category)) || (search && !text.includes(search)));
    }
  }

  private restoreForumFilters(): void {
    const importedContent = document.querySelector<HTMLElement>('.imported-content');
    if (!importedContent?.querySelector('.contain-forum .forum-thumb')) return;
    const params = new URLSearchParams(location.search);
    this.forumCategoryFilter = params.get('categoria') || '';
    this.forumSearchFilter = params.get('cerca') || '';
    const search = importedContent.querySelector<HTMLInputElement>('.ricerca-forum input[type="text"]');
    if (search) search.value = this.forumSearchFilter;
    importedContent.querySelectorAll('.container-sotto-categorie .container-link').forEach(item => {
      item.classList.toggle('forum-category-active', (item.textContent || '').trim() === this.forumCategoryFilter);
    });
    this.applyForumFilters(importedContent);
  }

  private initializeImportedPage(): void {
    const importedContent = document.querySelector<HTMLElement>('.imported-content');
    if (!importedContent) return;

    if (location.pathname.toLocaleLowerCase('it') === '/eventi') {
      const calendar = importedContent.querySelector<HTMLAnchorElement>('#ctl00_ContentPlaceHolder1_LnkBtn');
      if (calendar) {
        calendar.textContent = `CALENDARIO CAVALLERESCO ${new Date().getFullYear()}`;
        calendar.href = '/CalendarioEventi';
      }
    }

    importedContent.querySelectorAll<HTMLElement>('.NuovoContributo .form-add-intervento').forEach(form => {
      Array.from(form.childNodes).forEach(node => {
        if (node.nodeType === Node.TEXT_NODE && !(node.textContent || '').replaceAll('\u00a0', '').trim()) node.remove();
      });
    });

    this.initializeRichTextEditors(importedContent);
    this.initializeSidebarCalendars(importedContent);
    this.formalizeImportedControls(importedContent);
  }

  private initializeSidebarCalendars(importedContent: HTMLElement): void {
    const monthNames = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
    const panels = importedContent.querySelectorAll<HTMLElement>('[id$="_UpdPnlCalendar"]');
    if (!panels.length) return;

    this.calendarEventsPromise ??= fetch('/content/calendar-events.json')
      .then(response => response.ok ? response.json() as Promise<SidebarCalendarEvent[]> : [])
      .catch(() => []);

    void this.calendarEventsPromise.then(events => {
      this.calendarEvents = events;
      panels.forEach(panel => {
        if (!panel.isConnected) return;
        const heading = panel.querySelector<HTMLElement>('.calendar-title');
        const match = (heading?.textContent || '').toLocaleLowerCase('it').match(/(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)\s*-\s*(\d{4})/);
        const now = new Date();
        const month = match ? monthNames.indexOf(match[1]) : now.getMonth();
        const year = match ? Number(match[2]) : now.getFullYear();
        panel.dataset['npSidebarCalendar'] = 'true';
        this.renderSidebarCalendar(panel, year, month);
      });
    });
  }

  private changeSidebarCalendar(panel: HTMLElement, action: string): void {
    const now = new Date();
    let year = Number(panel.dataset['calendarYear']) || now.getFullYear();
    let month = Number(panel.dataset['calendarMonth']);
    if (!Number.isInteger(month)) month = now.getMonth();

    if (action === 'today') {
      year = now.getFullYear();
      month = now.getMonth();
    } else {
      const target = new Date(year, month + (action === 'previous' ? -1 : 1), 1);
      year = target.getFullYear();
      month = target.getMonth();
    }
    this.renderSidebarCalendar(panel, year, month);
  }

  private renderSidebarCalendar(panel: HTMLElement, year: number, month: number): void {
    const monthNames = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
    const heading = panel.querySelector<HTMLElement>('.calendar-title');
    const cells = panel.querySelector<HTMLElement>('.border-calendar');
    if (!heading || !cells) return;

    panel.dataset['calendarYear'] = String(year);
    panel.dataset['calendarMonth'] = String(month);

    const control = (label: string, action: string, iconClass?: string) => {
      const link = document.createElement('a');
      link.href = '#';
      link.dataset['calendarAction'] = action;
      link.setAttribute('aria-label', label);
      if (iconClass) {
        const icon = document.createElement('i');
        icon.className = `fa ${iconClass}`;
        icon.setAttribute('aria-hidden', 'true');
        link.appendChild(icon);
      } else link.textContent = label;
      return link;
    };
    const label = document.createElement('span');
    label.className = 'np-calendar-label';
    label.textContent = `${monthNames[month]} - ${year}`;
    heading.replaceChildren(
      control('oggi', 'today'),
      document.createTextNode(' '),
      control('Mese precedente', 'previous', 'fa-chevron-left'),
      document.createTextNode(' '),
      control('Mese successivo', 'next', 'fa-chevron-right'),
      document.createTextNode(' '),
      label
    );

    const today = new Date();
    const leading = (new Date(year, month, 1).getDay() + 6) % 7;
    const days = new Date(year, month + 1, 0).getDate();
    const trailing = (7 - ((leading + days) % 7)) % 7;
    const disabledCell = () => {
      const cell = document.createElement('a');
      cell.className = 'disabled';
      cell.setAttribute('aria-hidden', 'true');
      return cell;
    };
    const nodes: HTMLElement[] = Array.from({ length: leading }, disabledCell);

    for (let day = 1; day <= days; day += 1) {
      const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEvents = this.calendarEvents.filter(item => item.date === date);
      const cell = document.createElement('a');
      const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
      cell.className = `${dayEvents.length ? 'EventoEsistente' : 'DataVuota'}${isToday ? ' Today' : ''}`;
      cell.href = dayEvents[0]?.href || '#';
      if (dayEvents.length) {
        cell.title = dayEvents.map(item => item.title).join(' • ');
        cell.setAttribute('aria-label', `${day} ${monthNames[month]}: ${cell.title}`);
      }
      const number = document.createElement('span');
      number.textContent = String(day);
      cell.appendChild(number);
      nodes.push(cell);
    }
    nodes.push(...Array.from({ length: trailing }, disabledCell));
    cells.replaceChildren(...nodes);
  }

  private initializeRichTextEditors(importedContent: HTMLElement): void {
    importedContent.querySelectorAll<HTMLTextAreaElement>('textarea.summernote').forEach(textarea => {
      if (textarea.dataset['richEditorEnhanced']) return;
      textarea.dataset['richEditorEnhanced'] = 'true';

      const legacyImageNotice = Array.from(textarea.parentElement?.querySelectorAll<HTMLElement>('span') || [])
        .find(item => (item.textContent || '').includes('immagini interne'));
      if (legacyImageNotice) {
        legacyImageNotice.innerHTML = '<strong>Avvertenza:</strong><br>Per inserire immagini nel testo, usi il pulsante Immagine della barra strumenti oppure le trascini o le incolli direttamente nell’area di scrittura.';
      }

      const shell = document.createElement('div');
      shell.className = 'np-rich-editor';
      const toolbar = document.createElement('div');
      toolbar.className = 'np-rich-toolbar';
      toolbar.setAttribute('role', 'toolbar');
      toolbar.setAttribute('aria-label', 'Strumenti di formattazione');
      const editor = document.createElement('div');
      editor.className = 'np-rich-surface';
      editor.contentEditable = 'true';
      editor.setAttribute('role', 'textbox');
      editor.setAttribute('aria-multiline', 'true');
      editor.dataset['placeholder'] = textarea.placeholder || 'Inserisca il messaggio';
      editor.innerHTML = textarea.value;

      let savedRange: Range | null = null;
      const rememberSelection = () => {
        const selection = window.getSelection();
        if (selection?.rangeCount && editor.contains(selection.anchorNode)) savedRange = selection.getRangeAt(0).cloneRange();
      };
      const restoreSelection = () => {
        editor.focus();
        if (!savedRange) return;
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(savedRange);
      };
      const sync = () => {
        textarea.value = editor.innerHTML;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        rememberSelection();
      };
      const command = (name: string, value?: string) => {
        restoreSelection();
        document.execCommand(name, false, value);
        sync();
      };
      const addButton = (label: string, title: string, action: () => void, className = '') => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `np-rich-tool ${className}`.trim();
        button.textContent = label;
        button.title = title;
        button.setAttribute('aria-label', title);
        button.addEventListener('mousedown', event => event.preventDefault());
        button.addEventListener('click', action);
        toolbar.appendChild(button);
        return button;
      };
      const divider = () => {
        const line = document.createElement('span');
        line.className = 'np-rich-divider';
        line.setAttribute('aria-hidden', 'true');
        toolbar.appendChild(line);
      };

      addButton('↶', 'Annulli', () => command('undo'));
      addButton('↷', 'Ripristini', () => command('redo'));
      divider();
      addButton('B', 'Grassetto', () => command('bold'), 'np-rich-bold');
      addButton('I', 'Corsivo', () => command('italic'), 'np-rich-italic');
      addButton('U', 'Sottolineato', () => command('underline'), 'np-rich-underline');
      addButton('Titolo', 'Inserisca un titolo', () => command('formatBlock', 'h2'));
      addButton('Testo', 'Ripristini il paragrafo', () => command('formatBlock', 'p'));
      divider();
      addButton('• Lista', 'Elenco puntato', () => command('insertUnorderedList'));
      addButton('1. Lista', 'Elenco numerato', () => command('insertOrderedList'));
      addButton('❝', 'Citazione', () => command('formatBlock', 'blockquote'));
      divider();
      addButton('≡', 'Allinei a sinistra', () => command('justifyLeft'));
      addButton('≡', 'Centri', () => command('justifyCenter'), 'np-rich-center');
      addButton('≡', 'Allinei a destra', () => command('justifyRight'), 'np-rich-right');
      addButton('🔗', 'Inserisca un collegamento', () => {
        const url = window.prompt('Inserisca l’indirizzo del collegamento:');
        if (url) command('createLink', url);
      });

      const imageInput = document.createElement('input');
      imageInput.type = 'file';
      imageInput.accept = 'image/*';
      imageInput.multiple = true;
      imageInput.className = 'np-rich-image-input';
      const insertImages = (files: File[]) => {
        for (const file of files.filter(item => item.type.startsWith('image/'))) {
          const reader = new FileReader();
          reader.addEventListener('load', () => {
            restoreSelection();
            document.execCommand('insertImage', false, String(reader.result));
            sync();
          });
          reader.readAsDataURL(file);
        }
      };
      addButton('▧ Immagine', 'Inserisca immagini', () => {
        rememberSelection();
        imageInput.click();
      }, 'np-rich-image-tool');
      addButton('Tx', 'Rimuova la formattazione', () => command('removeFormat'));
      toolbar.appendChild(imageInput);

      imageInput.addEventListener('change', () => {
        insertImages(Array.from(imageInput.files || []));
        imageInput.value = '';
      });
      editor.addEventListener('input', sync);
      editor.addEventListener('keyup', rememberSelection);
      editor.addEventListener('mouseup', rememberSelection);
      editor.addEventListener('focus', rememberSelection);
      editor.addEventListener('paste', event => {
        const images = Array.from(event.clipboardData?.items || [])
          .filter(item => item.type.startsWith('image/'))
          .map(item => item.getAsFile())
          .filter((file): file is File => Boolean(file));
        if (!images.length) return;
        event.preventDefault();
        insertImages(images);
      });
      editor.addEventListener('dragover', event => {
        if (Array.from(event.dataTransfer?.items || []).some(item => item.type.startsWith('image/'))) {
          event.preventDefault();
          shell.classList.add('np-rich-dragging');
        }
      });
      editor.addEventListener('dragleave', () => shell.classList.remove('np-rich-dragging'));
      editor.addEventListener('drop', event => {
        shell.classList.remove('np-rich-dragging');
        const images = Array.from(event.dataTransfer?.files || []).filter(file => file.type.startsWith('image/'));
        if (!images.length) return;
        event.preventDefault();
        insertImages(images);
      });

      textarea.hidden = true;
      textarea.insertAdjacentElement('afterend', shell);
      shell.append(toolbar, editor);
    });
  }

  private formalizeImportedControls(importedContent: HTMLElement): void {
    const formalize = (value: string): string => {
      const upperCase = value.trim() !== '' && value === value.toLocaleUpperCase('it');
      const replacements: Array<[RegExp, string]> = [
        [/^(\s*)Torna\b/i, '$1Torni'],
        [/^(\s*)Vai\b/i, '$1Vada'],
        [/^(\s*)Inserisci\b/i, '$1Inserisca'],
        [/^(\s*)Seleziona\b/i, '$1Selezioni'],
        [/^(\s*)Scegli\b/i, '$1Scelga'],
        [/^(\s*)Clicca\b/i, '$1Clicchi'],
        [/^(\s*)Apri\b/i, '$1Apra'],
        [/^(\s*)Chiudi\b/i, '$1Chiuda'],
        [/^(\s*)Entra\b/i, '$1Entri'],
        [/^(\s*)Esci\b/i, '$1Esca'],
        [/^(\s*)Accedi\b/i, '$1Acceda'],
        [/^(\s*)Invia\b/i, '$1Invii'],
        [/^(\s*)Cerca\b/i, '$1Cerchi'],
        [/^(\s*)Scopri\b/i, '$1Scopra'],
        [/^(\s*)Continua\b/i, '$1Continui'],
        [/^(\s*)Leggi\b/i, '$1Legga'],
      ];
      let result = value;
      for (const [pattern, replacement] of replacements) result = result.replace(pattern, replacement);
      return upperCase ? result.toLocaleUpperCase('it') : result;
    };

    const controls = importedContent.querySelectorAll<HTMLElement>(
      '.back-forum, .btn-back-salotto a, a[id$="_LnkBack"], .btn-porta a, .btn-eventi a, .btn-calendario a, .form-add-intervento a, .form-add-risposta a, button'
    );
    controls.forEach(control => {
      control.childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE && node.textContent) node.textContent = formalize(node.textContent);
      });
    });
    importedContent.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[placeholder]').forEach(control => {
      control.placeholder = formalize(control.placeholder);
    });
    importedContent.querySelectorAll<HTMLElement>('[aria-label]').forEach(control => {
      const label = control.getAttribute('aria-label');
      if (label) control.setAttribute('aria-label', formalize(label));
    });
  }

  private forumParentPath(): string {
    const parts = location.pathname.split('/').filter(Boolean);
    if (parts.length <= 3) return location.pathname;
    let forum = parts[2];
    try { forum = decodeURIComponent(forum); } catch { /* retain the encoded value */ }
    return `/${parts[0]}/${parts[1]}/${forum.replace(/\s+/g, '-')}`;
  }

  ngOnDestroy(): void { this.subscription.unsubscribe(); }
}
