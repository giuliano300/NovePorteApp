import { Component, HostListener, Input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'np-site-header', standalone: true, imports: [RouterLink],
  templateUrl: './site-header.component.html', styleUrl: './site-header.component.scss'
})
export class SiteHeaderComponent {
  @Input() showPersonalArea = false;
  readonly mobileOpen = signal(false);
  readonly openMenu = signal<string | null>(null);
  toggleMobile(): void { this.mobileOpen.update(value => !value); }
  toggleMenu(menu: string): void { this.openMenu.update(value => value === menu ? null : menu); }
  @HostListener('document:click', ['$event']) closeOnOutsideClick(event: MouseEvent): void {
    const target = event.target as Element | null;
    if (!target?.closest('np-site-header')) this.closeMenus();
  }
  @HostListener('document:keydown.escape') closeMenus(): void { this.mobileOpen.set(false); this.openMenu.set(null); }
}
