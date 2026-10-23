import React, { createContext, useContext, useState, useMemo } from 'react';
import type { ProductDto } from '../../products/types/product.types';
import type { CartItem } from '../types/order.types';

interface CartContextType {
  items: CartItem[];
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  addItem: (product: ProductDto, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
}

const CART_STORAGE_KEY = 'enterprise_cart';

const CartContext = createContext<CartContextType | undefined>(undefined);

const loadInitialCart = (): CartItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    return saved ? (JSON.parse(saved) as CartItem[]) : [];
  } catch {
    return [];
  }
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(loadInitialCart);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const persistCart = (nextItems: CartItem[]) => {
    setItems(nextItems);
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(nextItems));
    } catch {
      // Ignore storage quota errors
    }
  };

  const addItem = (product: ProductDto, quantity = 1) => {
    if (product.stockQuantity <= 0) return;

    const existingIndex = items.findIndex((i) => i.product.id === product.id);
    if (existingIndex >= 0) {
      const updated = [...items];
      const currentQty = updated[existingIndex].quantity;
      const nextQty = Math.min(product.stockQuantity, currentQty + quantity);
      updated[existingIndex] = {
        product,
        quantity: nextQty,
      };
      persistCart(updated);
    } else {
      const initialQty = Math.min(product.stockQuantity, Math.max(1, quantity));
      persistCart([...items, { product, quantity: initialQty }]);
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    const updated = items.map((item) => {
      if (item.product.id !== productId) return item;
      const clampedQty = Math.min(item.product.stockQuantity, Math.max(1, quantity));
      return { ...item, quantity: clampedQty };
    });

    persistCart(updated);
  };

  const removeItem = (productId: string) => {
    persistCart(items.filter((i) => i.product.id !== productId));
  };

  const clearCart = () => {
    persistCart([]);
  };

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        isDrawerOpen,
        setIsDrawerOpen,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        totalItems,
        totalAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
