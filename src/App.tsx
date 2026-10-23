import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './features/auth/context/AuthContext';
import { CartProvider } from './features/orders/context/CartContext';
import { ToastProvider } from './components/ui/ToastContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { MainLayout } from './components/layout/MainLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ProductsPage } from './pages/ProductsPage';
import { OrdersPage } from './pages/OrdersPage';
import { ProfilePage } from './pages/ProfilePage';
import { UsersPage } from './pages/UsersPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 2, // 2 minutes
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Auth Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                {/* Protected Enterprise Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<MainLayout />}>
                    <Route path="/" element={<Navigate to="/products" replace />} />
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/orders" element={<OrdersPage />} />
                    <Route path="/profile" element={<ProfilePage />} />

                    {/* Admin-Only Identity Governance */}
                    <Route element={<ProtectedRoute requiredRoles={['Administrator']} />}>
                      <Route path="/users" element={<UsersPage />} />
                    </Route>
                  </Route>
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/products" replace />} />
              </Routes>
            </BrowserRouter>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
