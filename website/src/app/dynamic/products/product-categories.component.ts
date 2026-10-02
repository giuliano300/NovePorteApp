import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { SiteHeaderComponent } from '../../shared/site-header.component';
import { ProductsApiService } from './products-api.service';
import { ProductCategory } from './products.models';

@Component({
  selector: 'np-product-categories',
  standalone: true,
  imports: [CommonModule, RouterLink, SiteHeaderComponent],
  templateUrl: './product-categories.component.html',
  styleUrl: './product-categories.component.scss'
})
export class ProductCategoriesComponent implements OnInit {
  readonly api = inject(ProductsApiService);
  private readonly destroyRef = inject(DestroyRef);
  readonly categories = signal<ProductCategory[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  ngOnInit(): void {
    this.api.getCatalog().pipe(
      finalize(() => this.loading.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: categories => this.categories.set(categories),
      error: error => this.error.set(error.status === 401
        ? 'Acceda nuovamente alla Fortezza per consultare gli oggetti.'
        : 'Le categorie non sono al momento disponibili.')
    });
  }

  imageFallback(event: Event): void {
    (event.target as HTMLImageElement).src = '/assets/logo-porta.png';
  }
}
