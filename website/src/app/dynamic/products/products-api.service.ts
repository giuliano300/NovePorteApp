import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Product, ProductCategory, ProductOrder, ProductOrderResult } from './products.models';

@Injectable({ providedIn: 'root' })
export class ProductsApiService {
  private readonly http = inject(HttpClient);

  getCatalog(): Observable<ProductCategory[]> {
    return this.http.get<ProductCategory[]>('/api/site/products');
  }

  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(`/api/site/products/${id}`);
  }

  createOrder(order: ProductOrder): Observable<ProductOrderResult> {
    const body = new FormData();
    body.set('ProductId', String(order.productId));
    body.set('Quantity', String(order.quantity));
    body.set('Name', order.name);
    body.set('Surname', order.surname);
    body.set('Address', order.address);
    body.set('PostalCode', order.postalCode);
    body.set('City', order.city);
    body.set('Contact', order.contact);
    body.set('BuyerShipping', String(order.buyerShipping));
    body.set('RecipientName', order.recipientName);
    body.set('RecipientSurname', order.recipientSurname);
    body.set('RecipientAddress', order.recipientAddress);
    body.set('ShippingType', order.shippingType);
    body.set('PickupDetails', order.pickupDetails);
    body.set('receipt', order.receipt, order.receipt.name);
    return this.http.post<ProductOrderResult>('/api/site/products/orders', body);
  }

  image(value: string, category = false): string {
    const source = (value || '').trim();
    if (!source) return '/assets/logo-porta.png';
    let path = source;
    try {
      if (/^https?:\/\//i.test(source)) path = new URL(source).pathname;
      path = decodeURIComponent(path);
    } catch { /* conserva il valore ricevuto */ }
    if (/^\/Public\//i.test(path))
      return `/api/private-asset?path=${encodeURIComponent(path)}`;
    if (!path.startsWith('/') && !/^https?:\/\//i.test(path)) {
      const folder = category ? 'FotoCategorieProdotti' : 'FotoProdotti';
      return `/api/private-asset?path=${encodeURIComponent(`/Public/${folder}/${path}`)}`;
    }
    return source;
  }
}
