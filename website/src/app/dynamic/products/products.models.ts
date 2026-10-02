export interface Product {
  id: number;
  categoryId: number;
  name: string;
  description: string;
  photo: string;
  stock: number;
  price: number;
  shipping: number;
  photos: string[];
}

export interface ProductCategory {
  id: number;
  name: string;
  description: string;
  photo: string;
  products: Product[];
}

export interface ProductOrder {
  productId: number;
  quantity: number;
  name: string;
  surname: string;
  address: string;
  postalCode: string;
  city: string;
  contact: string;
  buyerShipping: boolean;
  recipientName: string;
  recipientSurname: string;
  recipientAddress: string;
  shippingType: string;
  pickupDetails: string;
  receipt: File;
}

export interface ProductOrderResult {
  orderId: number;
  message: string;
}
