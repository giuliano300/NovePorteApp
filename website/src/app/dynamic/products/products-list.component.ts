import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { SiteHeaderComponent } from '../../shared/site-header.component';
import { ProductsApiService } from './products-api.service';
import { ProductCategory } from './products.models';

@Component({
  selector: 'np-products-list',
  standalone: true,
  imports: [CommonModule, RouterLink, SiteHeaderComponent],
  templateUrl: './products-list.component.html',
  styleUrl: './products-list.component.scss'
})
export class ProductsListComponent implements OnInit {
  readonly api = inject(ProductsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  readonly category = signal<ProductCategory | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');

  ngOnInit(): void {
    const id = Number(this.route.snapshot.queryParamMap.get('IdCategoria') || this.route.snapshot.queryParamMap.get('idCategoria'));
    if (!Number.isInteger(id) || id <= 0) {
      this.loading.set(false);
      this.error.set('La categoria richiesta non è valida.');
      return;
    }
    this.api.getCatalog().pipe(
      finalize(() => this.loading.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: categories => {
        const category = categories.find(item => item.id === id) || null;
        this.category.set(category);
        if (!category) this.error.set('La categoria richiesta non è disponibile.');
      },
      error: error => this.error.set(error.status === 401
        ? 'Acceda nuovamente alla Fortezza per consultare gli oggetti.'
        : 'Gli oggetti non sono al momento disponibili.')
    });
  }

  imageFallback(event: Event): void {
    (event.target as HTMLImageElement).src = '/assets/logo-porta.png';
  }

  summary(value: string): string {
    const parsed = new DOMParser().parseFromString(value || '', 'text/html');
    const text = (parsed.body.textContent || '').replace(/\s+/g, ' ').trim();
    return text.length > 220 ? `${text.slice(0, 217).trimEnd()}…` : text;
  }
}
