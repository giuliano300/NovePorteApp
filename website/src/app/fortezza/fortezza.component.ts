import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from './auth.service';
import { SiteHeaderComponent } from '../shared/site-header.component';

@Component({ selector: 'np-fortezza', standalone: true, imports: [RouterLink, SiteHeaderComponent], templateUrl: './fortezza.component.html', styleUrl: './fortezza.component.scss' })
export class FortezzaComponent {
  constructor(private readonly auth: AuthService, private readonly router: Router) {}
  logout(): void { this.auth.logout().subscribe(() => void this.router.navigateByUrl('/Fortezza')); }
}
