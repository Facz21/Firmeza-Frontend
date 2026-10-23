import type { ProductDto } from '../../products/types/product.types';

export const PurchaseOrderStatus = {
  PendingApproval: 0,
  Approved: 1,
  Rejected: 2,
} as const;

export type PurchaseOrderStatus = (typeof PurchaseOrderStatus)[keyof typeof PurchaseOrderStatus];

export const PurchaseOrderStatusLabels: Record<PurchaseOrderStatus, string> = {
  [PurchaseOrderStatus.PendingApproval]: 'Pendiente de Aprobación',
  [PurchaseOrderStatus.Approved]: 'Compra Aprobada',
  [PurchaseOrderStatus.Rejected]: 'Rechazada',
};

export const PaymentMethod = {
  CashOnDelivery: 0,
  BankTransfer: 1,
  CorporateCredit: 2,
  CardOnDelivery: 3,
} as const;

export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const PaymentMethodLabels: Record<PaymentMethod, string> = {
  [PaymentMethod.CashOnDelivery]: 'Efectivo contra entrega',
  [PaymentMethod.BankTransfer]: 'Transferencia Bancaria',
  [PaymentMethod.CorporateCredit]: 'Crédito Corporativo / Orden de Compra',
  [PaymentMethod.CardOnDelivery]: 'Datáfono / Tarjeta al recibir',
};

export interface CartItem {
  product: ProductDto;
  quantity: number;
}

export interface CreateOrderItemRequest {
  productId: string;
  quantity: number;
}

export interface CreatePurchaseOrderRequest {
  deliveryPoint: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  items: CreateOrderItemRequest[];
}

export interface PurchaseOrderItemDto {
  id: string;
  productId: string;
  productSku: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface PurchaseOrderDto {
  id: string;
  orderNumber: string;
  userId: string;
  userEmail: string;
  userFullName: string;
  deliveryPoint: string;
  paymentMethod: PaymentMethod;
  notes?: string | null;
  status: PurchaseOrderStatus;
  totalAmount: number;
  createdAt: string;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  adminComments?: string | null;
  items: PurchaseOrderItemDto[];
}
