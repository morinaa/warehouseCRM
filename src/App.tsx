import { Center, Spinner } from '@chakra-ui/react';
import { lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './layout/AppLayout';
import { useAuth } from './providers/AuthProvider';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const RetailersPage = lazy(() => import('./pages/ContactsPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const SuppliersPage = lazy(() => import('./pages/SuppliersPage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const SupplierDetailPage = lazy(() => import('./pages/SupplierDetailPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const SuperAdminPage = lazy(() => import('./pages/SuperAdminPage'));
const LogsPage = lazy(() => import('./pages/LogsPage'));

const RequireAuth = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <Center minH="100vh">
        <Spinner color="brand.500" />
      </Center>
    );
  }
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <Suspense
      fallback={
        <Center minH="100vh">
          <Spinner color="brand.500" />
        </Center>
      }
    >
      <Routes>
        <Route path="/auth/login" element={<AuthPage mode="login" />} />
        <Route path="/auth/signup" element={<Navigate to="/auth/login" replace />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="retailers" element={<RetailersPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="logs" element={<LogsPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="suppliers" element={<SuppliersPage />} />
          <Route path="suppliers/:id" element={<SupplierDetailPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/:id" element={<ProductDetailPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="superadmin" element={<SuperAdminPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
