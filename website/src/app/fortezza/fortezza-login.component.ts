import { HttpErrorResponse } from '@angular/common/http';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from './auth.service';
import { SiteHeaderComponent } from '../shared/site-header.component';

@Component({ selector: 'np-fortezza-login', standalone: true, imports: [FormsModule, RouterLink, SiteHeaderComponent], templateUrl: './fortezza-login.component.html', styleUrl: './fortezza-login.component.scss' })
export class FortezzaLoginComponent {
  password = '';
  readonly loading = signal(false);
  readonly error = signal('');
  private readonly returnUrl: string;

  constructor(private readonly auth: AuthService, private readonly router: Router, route: ActivatedRoute) {
    this.returnUrl = this.safeReturnUrl(route.snapshot.queryParamMap.get('returnUrl'));
  }

  submit(): void {
    if (!this.password || this.loading()) return;
    this.loading.set(true); this.error.set('');
    this.auth.login(this.password).subscribe({
      next: () => void this.router.navigateByUrl(this.returnUrl),
      error: (error: HttpErrorResponse) => { this.loading.set(false); this.error.set(error.error?.message || 'Accesso non riuscito.'); }
    });
  }

  private safeReturnUrl(value: string | null): string {
    if (!value?.startsWith('/') || value.startsWith('//')) return '/FortezzaDet';
    if (/^\/Fortezza(?:Code)?(?:[?#]|$)/i.test(value)) return '/FortezzaDet';
    return value;
  }
}
