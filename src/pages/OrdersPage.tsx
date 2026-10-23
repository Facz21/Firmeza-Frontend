import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '../features/orders/services/orderService';
import {
  PurchaseOrderStatus,
  PurchaseOrderStatusLabels,
  PaymentMethodLabels,
  type PurchaseOrderDto,
} from '../features/orders/types/order.types';
import { useAuth } from '../features/auth/context/AuthContext';
import { useToast } from '../components/ui/ToastContext';
import { useCart } from '../features/orders/context/CartContext';
import {
  ShoppingCart,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  CreditCard,
  User,
  Package,
  MessageSquare,
} from 'lucide-react';

export const OrdersPage: React.FC = () => {
  const { isAdmin, isAuditor } = useAuth();
  const canViewAll = isAdmin || isAuditor;
  const { notify } = useToast();
  const { setIsDrawerOpen, totalItems } = useCart();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [reviewComments, setReviewComments] = useState<Record<string, string>>({});

  const { data: orders = [], isLoading } = useQuery({
    queryKey: canViewAll ? ['all-orders'] : ['my-orders'],
    queryFn: () => (canViewAll ? orderService.getAllOrders() : orderService.getMyOrders()),
  });

  const refreshOrdersAndStock = () => {
    queryClient.invalidateQueries({ queryKey: ['all-orders'] });
    queryClient.invalidateQueries({ queryKey: ['my-orders'] });
    queryClient.invalidateQueries({ queryKey: ['products'] });
  };

  const approveMutation = useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) =>
      orderService.approveOrder(id, comment),
    onSuccess: (updated) => {
      refreshOrdersAndStock();
      notify({
        variant: 'success',
        title: `Compra ${updated.orderNumber} aprobada`,
        description: 'El carrito fue aprobado y el stock se descontó automáticamente del inventario.',
      });
    },
    onError: (err: unknown) => {
      notify({
        variant: 'error',
        title: 'Error al aprobar la compra',
        description: err instanceof Error ? err.message : 'Verifica el stock disponible.',
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) =>
      orderService.rejectOrder(id, comment),
    onSuccess: (updated) => {
      refreshOrdersAndStock();
      notify({
        variant: 'warning',
        title: `Carrito ${updated.orderNumber} rechazado`,
        description: 'La solicitud de compra ha sido marcada como rechazada.',
      });
    },
    onError: (err: unknown) => {
      notify({
        variant: 'error',
        title: 'Error al rechazar el carrito',
        description: err instanceof Error ? err.message : 'No se pudo procesar la acción.',
      });
    },
  });

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'ALL') return orders;
    return orders.filter((o) => String(o.status) === statusFilter);
  }, [orders, statusFilter]);

  const metrics = useMemo(() => {
    const pending = orders.filter((o) => o.status === PurchaseOrderStatus.PendingApproval).length;
    const approvedOrders = orders.filter((o) => o.status === PurchaseOrderStatus.Approved);
    const approvedValue = approvedOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    return {
      total: orders.length,
      pending,
      approvedCount: approvedOrders.length,
      approvedValue,
    };
  }, [orders]);

  const getStatusBadge = (status: PurchaseOrderStatus) => {
    switch (status) {
      case PurchaseOrderStatus.Approved:
        return {
          style: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
        };
      case PurchaseOrderStatus.Rejected:
        return {
          style: 'bg-rose-50 text-rose-800 border-rose-300',
          icon: <XCircle className="w-3.5 h-3.5 text-rose-600" />,
        };
      default:
        return {
          style: 'bg-amber-50 text-amber-900 border-amber-300',
          icon: <Clock className="w-3.5 h-3.5 text-amber-600" />,
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {canViewAll
              ? 'Aprobación de Carritos y Órdenes de Compra'
              : 'Mis Carritos y Solicitudes de Compra'}
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            {canViewAll
              ? 'Revisa los carritos enviados por los usuarios, verifica punto de entrega y método de pago, y aprueba las compras.'
              : 'Consulta el estado de aprobación de tus carritos enviados, punto de entrega y método de pago.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-subtle transition"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Ver Carrito Actual ({totalItems})</span>
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-subtle">
          <div className="text-xs font-semibold text-slate-500">Total Carritos</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">{metrics.total}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Solicitudes registradas</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-subtle">
          <div className="text-xs font-semibold text-slate-500">Pendientes de Aprobación</div>
          <div className="text-2xl font-bold font-mono text-amber-700 mt-1">{metrics.pending}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Requieren revisión de Admin</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-subtle">
          <div className="text-xs font-semibold text-slate-500">Compras Aprobadas</div>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
            {metrics.approvedCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Stock descontado</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-subtle">
          <div className="text-xs font-semibold text-slate-500">Valor Total Aprobado</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
            ${metrics.approvedValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Acumulado en órdenes</div>
        </div>
      </div>

      {/* Status Filter Pills */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-subtle flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-600 mr-1">Filtrar por estado:</span>
        {[
          { label: 'Todos', value: 'ALL' },
          {
            label: 'Pendientes de Aprobación',
            value: String(PurchaseOrderStatus.PendingApproval),
          },
          { label: 'Aprobados', value: String(PurchaseOrderStatus.Approved) },
          { label: 'Rechazados', value: String(PurchaseOrderStatus.Rejected) },
        ].map((pill) => {
          const active = statusFilter === pill.value;
          return (
            <button
              key={pill.value}
              type="button"
              onClick={() => setStatusFilter(pill.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                active
                  ? 'bg-brand-950 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {pill.label}
            </button>
          );
        })}
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
          Cargando carritos de compra...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
            <Package className="w-5 h-5" />
          </div>
          <p className="text-sm font-bold text-slate-900">No hay carritos registrados</p>
          <p className="text-xs text-slate-600">
            Agrega productos desde el catálogo de activos y envía tu carrito para aprobación.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order: PurchaseOrderDto) => {
            const badge = getStatusBadge(order.status);
            const isPending = order.status === PurchaseOrderStatus.PendingApproval;

            return (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-slate-200/90 shadow-subtle overflow-hidden"
              >
                {/* Order Top Bar */}
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-sm font-bold text-slate-950">
                      {order.orderNumber}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.style}`}
                    >
                      {badge.icon}
                      {PurchaseOrderStatusLabels[order.status]}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {new Date(order.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="font-mono text-base font-bold text-slate-950 tabular-nums">
                    Total: $
                    {order.totalAmount.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>

                {/* Metadata Grid: User, Delivery Point, Payment Method */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-slate-100 text-xs">
                  <div className="flex items-start gap-2.5">
                    <User className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-500 block">Solicitante</span>
                      <span className="font-bold text-slate-900 block mt-0.5">
                        {order.userFullName}
                      </span>
                      <span className="font-mono text-[11px] text-slate-600">
                        {order.userEmail}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-500 block">Punto de Entrega</span>
                      <span className="font-bold text-slate-900 block mt-0.5">
                        {order.deliveryPoint}
                      </span>
                      {order.notes && (
                        <span className="text-[11px] text-slate-600 block mt-0.5">
                          Nota: {order.notes}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <CreditCard className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-500 block">Método de Pago</span>
                      <span className="font-bold text-slate-900 block mt-0.5">
                        {PaymentMethodLabels[order.paymentMethod]}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold uppercase text-slate-600">
                        <th className="py-2.5 px-6">SKU</th>
                        <th className="py-2.5 px-4">Producto</th>
                        <th className="py-2.5 px-4 text-right">Precio Unitario</th>
                        <th className="py-2.5 px-4 text-right">Cantidad</th>
                        <th className="py-2.5 px-6 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {order.items.map((item) => (
                        <tr key={item.id}>
                          <td className="py-2.5 px-6 font-mono font-semibold text-brand-700">
                            {item.productSku}
                          </td>
                          <td className="py-2.5 px-4 font-medium text-slate-900">
                            {item.productName}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                            ${item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                            {item.quantity} uds
                          </td>
                          <td className="py-2.5 px-6 text-right font-mono font-semibold text-slate-950 tabular-nums">
                            ${item.lineTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Review Status or Admin Approval Controls */}
                {order.reviewedAt && (
                  <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        <strong>Observación Admin:</strong>{' '}
                        {order.adminComments || 'Sin observaciones adicionales.'}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-slate-500">
                      Revisado por {order.reviewedBy} ·{' '}
                      {new Date(order.reviewedAt).toLocaleString()}
                    </span>
                  </div>
                )}

                {isAdmin && isPending && (
                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <input
                      type="text"
                      value={reviewComments[order.id] || ''}
                      onChange={(e) =>
                        setReviewComments((prev) => ({
                          ...prev,
                          [order.id]: e.target.value,
                        }))
                      }
                      placeholder="Comentario de aprobación o motivo de rechazo (opcional)..."
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:border-brand-600 focus:outline-none"
                    />

                    <div className="flex items-center gap-2 justify-end">
                      <button
                        type="button"
                        disabled={rejectMutation.isPending || approveMutation.isPending}
                        onClick={() =>
                          rejectMutation.mutate({
                            id: order.id,
                            comment: reviewComments[order.id],
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold transition disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Rechazar</span>
                      </button>

                      <button
                        type="button"
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                        onClick={() =>
                          approveMutation.mutate({
                            id: order.id,
                            comment: reviewComments[order.id],
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-subtle transition disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Aprobar Compra</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
