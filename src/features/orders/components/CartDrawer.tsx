import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCart } from '../context/CartContext';
import { orderService } from '../services/orderService';
import {
  PaymentMethod,
  PaymentMethodLabels,
  type PaymentMethod as PaymentMethodType,
} from '../types/order.types';
import { useToast } from '../../../components/ui/ToastContext';
import {
  ShoppingCart,
  X,
  Plus,
  Minus,
  Trash2,
  MapPin,
  CreditCard,
  Send,
  FileText,
  Package,
} from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const {
    items,
    isDrawerOpen,
    setIsDrawerOpen,
    updateQuantity,
    removeItem,
    clearCart,
    totalItems,
    totalAmount,
  } = useCart();

  const { notify } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [deliveryPoint, setDeliveryPoint] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>(
    PaymentMethod.CashOnDelivery
  );
  const [notes, setNotes] = useState('');

  const submitOrderMutation = useMutation({
    mutationFn: () =>
      orderService.submitOrder({
        deliveryPoint: deliveryPoint.trim(),
        paymentMethod,
        notes: notes.trim() || undefined,
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
        })),
      }),
    onSuccess: (createdOrder) => {
      clearCart();
      setDeliveryPoint('');
      setNotes('');
      setIsDrawerOpen(false);
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      queryClient.invalidateQueries({ queryKey: ['all-orders'] });
      notify({
        variant: 'success',
        title: `Carrito ${createdOrder.orderNumber} enviado`,
        description:
          'Tu solicitud de compra quedó pendiente de aprobación por un Administrador.',
      });
      navigate('/orders');
    },
    onError: (err: unknown) => {
      notify({
        variant: 'error',
        title: 'No se pudo enviar el carrito',
        description:
          err instanceof Error
            ? err.message
            : 'Verifica el stock disponible y los datos de entrega.',
      });
    },
  });

  if (!isDrawerOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryPoint.trim()) {
      notify({
        variant: 'warning',
        title: 'Punto de entrega requerido',
        description: 'Por favor indica la dirección, bodega o sede de entrega.',
      });
      return;
    }
    submitOrderMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
        onClick={() => setIsDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div className="relative z-10 w-full max-w-lg bg-white h-full shadow-elevated border-l border-slate-200 flex flex-col justify-between overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-brand-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-800 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-brand-300" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">
                Carrito de Solicitud de Compra
              </h2>
              <p className="text-[11px] text-brand-200">
                {totalItems} {totalItems === 1 ? 'unidad seleccionada' : 'unidades seleccionadas'} · Sujeto a aprobación administrativa
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsDrawerOpen(false)}
            aria-label="Cerrar carrito"
            className="p-1.5 rounded-lg text-brand-200 hover:text-white hover:bg-brand-900 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mb-3">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Tu carrito está vacío</h3>
            <p className="text-xs text-slate-600 mt-1 max-w-xs leading-relaxed">
              Agrega equipos o suministros desde el catálogo de activos para configurar tu solicitud de compra.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
            {/* Scrollable Items & Checkout Fields */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Items List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Productos en el Carrito ({items.length})
                  </span>
                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-800"
                  >
                    Vaciar carrito
                  </button>
                </div>

                <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                  {items.map(({ product, quantity }) => (
                    <div key={product.id} className="p-3.5 bg-white flex flex-col gap-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="font-mono text-[11px] font-semibold text-brand-700 block">
                            {product.sku}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {product.name}
                          </h4>
                          <span className="text-[11px] text-slate-500 font-mono">
                            ${product.price.toLocaleString('en-US', { minimumFractionDigits: 2 })} c/u · Stock máx: {product.stockQuantity}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(product.id)}
                          title="Quitar producto"
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        {/* Quantity Selector */}
                        <div className="inline-flex items-center rounded-lg border border-slate-300 bg-white">
                          <button
                            type="button"
                            onClick={() => updateQuantity(product.id, quantity - 1)}
                            className="p-1.5 text-slate-600 hover:text-slate-950 hover:bg-slate-100 rounded-l-lg transition"
                            aria-label="Disminuir cantidad"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            min={1}
                            max={product.stockQuantity}
                            value={quantity}
                            onChange={(e) =>
                              updateQuantity(product.id, parseInt(e.target.value, 10) || 1)
                            }
                            aria-label={`Cantidad para ${product.name}`}
                            className="w-12 text-center font-mono text-xs font-bold text-slate-900 focus:outline-none"
                          />
                          <button
                            type="button"
                            disabled={quantity >= product.stockQuantity}
                            onClick={() => updateQuantity(product.id, quantity + 1)}
                            className="p-1.5 text-slate-600 hover:text-slate-950 hover:bg-slate-100 rounded-r-lg transition disabled:opacity-40"
                            aria-label="Aumentar cantidad"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="font-mono text-xs font-bold text-slate-900 tabular-nums">
                          ${(product.price * quantity).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery & Payment Specification */}
              <div className="space-y-4 pt-2 border-t border-slate-200">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Datos de Entrega y Método de Pago
                </span>

                <div>
                  <label
                    htmlFor="cart-delivery-point"
                    className="block text-xs font-semibold text-slate-800 mb-1.5"
                  >
                    Punto de Entrega / Sede de Recepción *
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      id="cart-delivery-point"
                      type="text"
                      required
                      value={deliveryPoint}
                      onChange={(e) => setDeliveryPoint(e.target.value)}
                      placeholder="Ej. Bodega Central Calle 100 #15-20 / Planta Norte"
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:border-brand-600 text-xs text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="cart-payment-method"
                    className="block text-xs font-semibold text-slate-800 mb-1.5"
                  >
                    Método de Pago (Sin pasarela en línea) *
                  </label>
                  <div className="relative">
                    <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <select
                      id="cart-payment-method"
                      value={paymentMethod}
                      onChange={(e) =>
                        setPaymentMethod(Number(e.target.value) as PaymentMethodType)
                      }
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:border-brand-600 text-xs font-semibold text-slate-900 bg-white focus:outline-none"
                    >
                      {Object.entries(PaymentMethodLabels).map(([val, label]) => (
                        <option key={val} value={val}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="cart-notes"
                    className="block text-xs font-semibold text-slate-800 mb-1.5"
                  >
                    Instrucciones o Notas Adicionales (Opcional)
                  </label>
                  <div className="relative">
                    <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <textarea
                      id="cart-notes"
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Horario de recepción, contacto en sitio o referencia..."
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:border-brand-600 text-xs text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Summary & Submit */}
            <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">
                  Total Estimado ({totalItems} {totalItems === 1 ? 'unidad' : 'unidades'})
                </span>
                <span className="text-lg font-bold font-mono text-slate-950 tabular-nums">
                  ${totalAmount.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              <button
                type="submit"
                disabled={submitOrderMutation.isPending}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-subtle transition disabled:opacity-60"
              >
                <Send className="w-4 h-4" />
                <span>
                  {submitOrderMutation.isPending
                    ? 'Enviando solicitud...'
                    : 'Enviar Carrito para Aprobación'}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
