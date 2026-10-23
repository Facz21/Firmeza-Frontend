import { apiClient } from '../../../services/apiClient';
import type {
  CreatePurchaseOrderRequest,
  PurchaseOrderDto,
  PurchaseOrderStatus,
} from '../types/order.types';

export const orderService = {
  async getMyOrders(): Promise<PurchaseOrderDto[]> {
    const response = await apiClient.get<PurchaseOrderDto[]>('/orders/my');
    return response.data;
  },

  async getAllOrders(status?: PurchaseOrderStatus): Promise<PurchaseOrderDto[]> {
    const response = await apiClient.get<PurchaseOrderDto[]>('/orders', {
      params: status !== undefined ? { status } : undefined,
    });
    return response.data;
  },

  async submitOrder(request: CreatePurchaseOrderRequest): Promise<PurchaseOrderDto> {
    const response = await apiClient.post<PurchaseOrderDto>('/orders', request);
    return response.data;
  },

  async approveOrder(id: string, adminComments?: string): Promise<PurchaseOrderDto> {
    const response = await apiClient.put<PurchaseOrderDto>(`/orders/${id}/approve`, {
      adminComments,
    });
    return response.data;
  },

  async rejectOrder(id: string, adminComments?: string): Promise<PurchaseOrderDto> {
    const response = await apiClient.put<PurchaseOrderDto>(`/orders/${id}/reject`, {
      adminComments,
    });
    return response.data;
  },
};
