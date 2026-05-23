import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RequireAuth } from './RequireAuth';
import { RoleGuard } from './RoleGuard';
import { ADMIN_GROUP, PROVIDER_GROUP } from './groups';
import SplashPage from '@/pages/SplashPage';
import LoginPage from '@/pages/auth/LoginPage';
import NotFoundPage from '@/pages/NotFoundPage';
import ForbiddenPage from '@/pages/ForbiddenPage';
import AdminLayout from '@/pages/admin/AdminLayout';
import AdminOverviewPage from '@/pages/admin/OverviewPage';
import AdminCompaniesListPage from '@/pages/admin/companies/ListPage';
import AdminCompanyDetailPage from '@/pages/admin/companies/DetailPage';
import AdminOrdersListPage from '@/pages/admin/orders/ListPage';
import AdminOrderDetailPage from '@/pages/admin/orders/DetailPage';
import AdminAuditPage from '@/pages/admin/AuditPage';
import AdminCategoriesPage from '@/pages/admin/catalog/CategoriesPage';
import AdminServicesPage from '@/pages/admin/catalog/ServicesPage';
import AdminCouponsPage from '@/pages/admin/CouponsPage';
import AdminBannersPage from '@/pages/admin/BannersPage';
import AdminSettlementsPage from '@/pages/admin/SettlementsPage';
import AdminReportsPage from '@/pages/admin/ReportsPage';
import AdminUsersPage from '@/pages/admin/UsersPage';
import ProviderLayout from '@/pages/provider/ProviderLayout';
import ProviderOverviewPage from '@/pages/provider/OverviewPage';
import ProviderOrdersListPage from '@/pages/provider/orders/ListPage';
import ProviderOrderDetailPage from '@/pages/provider/orders/DetailPage';
import ProviderStaffPage from '@/pages/provider/StaffPage';
import ProviderSettlementsPage from '@/pages/provider/SettlementsPage';
import ProviderFinancialsPage from '@/pages/provider/FinancialsPage';
import ProviderProfilePage from '@/pages/provider/ProfilePage';

export const router = createBrowserRouter([
  { path: '/', element: <SplashPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/403', element: <ForbiddenPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        path: '/admin',
        element: <RoleGuard allow={ADMIN_GROUP} />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { index: true, element: <Navigate to="/admin/overview" replace /> },
              { path: 'overview', element: <AdminOverviewPage /> },
              { path: 'companies', element: <AdminCompaniesListPage /> },
              { path: 'companies/:id', element: <AdminCompanyDetailPage /> },
              { path: 'users', element: <AdminUsersPage /> },
              { path: 'orders', element: <AdminOrdersListPage /> },
              { path: 'orders/:id', element: <AdminOrderDetailPage /> },
              { path: 'audit', element: <AdminAuditPage /> },
              { path: 'catalog/categories', element: <AdminCategoriesPage /> },
              { path: 'catalog/services', element: <AdminServicesPage /> },
              { path: 'coupons', element: <AdminCouponsPage /> },
              { path: 'banners', element: <AdminBannersPage /> },
              { path: 'settlements', element: <AdminSettlementsPage /> },
              { path: 'reports/sales', element: <AdminReportsPage /> },
            ],
          },
        ],
      },
      {
        path: '/provider',
        element: <RoleGuard allow={PROVIDER_GROUP} />,
        children: [
          {
            element: <ProviderLayout />,
            children: [
              { index: true, element: <Navigate to="/provider/overview" replace /> },
              { path: 'overview', element: <ProviderOverviewPage /> },
              { path: 'orders', element: <ProviderOrdersListPage /> },
              { path: 'orders/:id', element: <ProviderOrderDetailPage /> },
              { path: 'staff', element: <ProviderStaffPage /> },
              { path: 'settlements', element: <ProviderSettlementsPage /> },
              { path: 'financials', element: <ProviderFinancialsPage /> },
              { path: 'profile', element: <ProviderProfilePage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
