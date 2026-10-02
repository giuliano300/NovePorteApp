import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { SiteHeaderComponent } from '../../shared/site-header.component';
import { ProductsApiService } from './products-api.service';
import { Product } from './products.models';

@Component({
  selector: 'np-product-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, SiteHeaderComponent],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss'
})
export class ProductDetailComponent implements OnInit {
  readonly api = inject(ProductsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  readonly product = signal<Product | null>(null);
  readonly selectedPhoto = signal('');
  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  receipt: File | null = null;
  receiptName = '';

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    surname: ['', Validators.required],
    address: ['', Validators.required],
    postalCode: ['', Validators.required],
    city: ['', Validators.required],
    contact: ['', Validators.required],
    buyerShipping: [true],
    recipientName: [''],
    recipientSurname: [''],
    recipientAddress: [''],
    shippingType: ['', Validators.required],
    pickupDetails: [''],
    quantity: [1, [Validators.required, Validators.min(1)]]
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.queryParamMap.get('Id') || this.route.snapshot.queryParamMap.get('id'));
    if (!Number.isInteger(id) || id <= 0) {
      this.loading.set(false);
      this.error.set('L’oggetto richiesto non è valido.');
      return;
    }
    this.api.getProduct(id).pipe(
      finalize(() => this.loading.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: product => {
        this.product.set(product);
        this.selectedPhoto.set(product.photos[0] || product.photo);
        this.form.controls.quantity.addValidators(Validators.max(Math.max(product.stock, 1)));
        this.form.controls.quantity.updateValueAndValidity();
      },
      error: error => this.error.set(error.status === 404
        ? 'L’oggetto richiesto non è disponibile.'
        : error.status === 401
          ? 'Acceda nuovamente alla Fortezza per consultare gli oggetti.'
          : 'La scheda dell’oggetto non è al momento disponibile.')
    });
  }

  choosePhoto(photo: string): void { this.selectedPhoto.set(photo); }

  onReceipt(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.receipt = input.files?.[0] || null;
    this.receiptName = this.receipt?.name || '';
  }

  total(): number {
    const product = this.product();
    if (!product) return 0;
    const quantity = Math.max(1, Number(this.form.controls.quantity.value) || 1);
    const shipping = this.form.controls.shippingType.value === 'Spedizione' ? product.shipping : 0;
    return product.price * quantity + shipping;
  }

  submit(): void {
    const product = this.product();
    this.error.set('');
    this.success.set('');
    this.form.markAllAsTouched();
    if (!this.form.controls.buyerShipping.value) {
      const recipient = [this.form.controls.recipientName, this.form.controls.recipientSurname, this.form.controls.recipientAddress];
      if (recipient.some(control => !control.value.trim())) {
        this.error.set('Compili tutti i dati del destinatario.');
        return;
      }
    }
    if (!product || this.form.invalid) {
      this.error.set('Compili tutti i campi obbligatori.');
      return;
    }
    if (this.form.controls.shippingType.value === 'Ritiro de visu' && !this.form.controls.pickupDetails.value.trim()) {
      this.error.set('Indichi il luogo o l’evento per il ritiro de visu.');
      return;
    }
    if (!this.receipt) {
      this.error.set('Selezioni il documento comprovante l’acquisto.');
      return;
    }
    const value = this.form.getRawValue();
    this.submitting.set(true);
    this.api.createOrder({
      productId: product.id,
      quantity: Number(value.quantity),
      name: value.name.trim(),
      surname: value.surname.trim(),
      address: value.address.trim(),
      postalCode: value.postalCode.trim(),
      city: value.city.trim(),
      contact: value.contact.trim(),
      buyerShipping: value.buyerShipping,
      recipientName: value.recipientName.trim(),
      recipientSurname: value.recipientSurname.trim(),
      recipientAddress: value.recipientAddress.trim(),
      shippingType: value.shippingType,
      pickupDetails: value.pickupDetails.trim(),
      receipt: this.receipt
    }).pipe(
      finalize(() => this.submitting.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: result => this.success.set(`${result.message} Numero ordine: ${result.orderId}.`),
      error: (response: HttpErrorResponse) => this.error.set(
        response.error?.message || 'Non è stato possibile inviare l’ordine. Riprovi tra qualche minuto.'
      )
    });
  }

  invalid(name: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[name];
    return control.invalid && control.touched;
  }

  imageFallback(event: Event): void {
    (event.target as HTMLImageElement).src = '/assets/logo-porta.png';
  }
}
