import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import { SiteHeaderComponent } from '../shared/site-header.component';

@Component({
  selector: 'np-fortezza-entrance',
  standalone: true,
  imports: [RouterLink, SiteHeaderComponent],
  templateUrl: './fortezza-entrance.component.html',
  styleUrl: './fortezza-entrance.component.scss'
})
export class FortezzaEntranceComponent implements AfterViewInit, OnDestroy {
  private redirectTimer?: ReturnType<typeof setTimeout>;
  readonly loginQueryParams: Params | null;

  constructor(private readonly router: Router, route: ActivatedRoute) {
    const returnUrl = this.safeReturnUrl(route.snapshot.queryParamMap.get('returnUrl'));
    this.loginQueryParams = returnUrl ? { returnUrl } : null;
  }

  ngAfterViewInit(): void {
    // Il vecchio script concludeva la sequenza dopo circa 8,8 secondi.
    if (window.innerWidth >= 1025 && window.innerWidth <= 1920) {
      this.redirectTimer = setTimeout(() => void this.router.navigate(['/FortezzaCode'], {
        queryParams: this.loginQueryParams
      }), 8800);
    }
  }

  ngOnDestroy(): void {
    if (this.redirectTimer) clearTimeout(this.redirectTimer);
  }

  private safeReturnUrl(value: string | null): string | null {
    return value?.startsWith('/') && !value.startsWith('//') ? value : null;
  }
}
