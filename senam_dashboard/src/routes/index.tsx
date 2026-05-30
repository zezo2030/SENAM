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
import AdminAuditPage from '@/pages/admin/AuditPage';
import AdminCategoriesPage from '@/pages/admin/catalog/CategoriesPage';
import AdminServicesPage from '@/pages/admin/catalog/ServicesPage';
import AdminBannersPage from '@/pages/admin/BannersPage';
import AdminReportsPage from '@/pages/admin/ReportsPage';
import AdminUsersPage from '@/pages/admin/UsersPage';
import ProviderLayout from '@/pages/provider/ProviderLayout';
import ProviderProfileLayout, {
  IdentityPage,
  MediaPage,
  ContactsPage,
  LocationPage,
  ServicesPage,
  FeaturesPage,
  GalleryPage,
} from '@/pages/provider/ProfilePage';

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
              { path: 'audit', element: <AdminAuditPage /> },
              { path: 'catalog/categories', element: <AdminCategoriesPage /> },
              { path: 'catalog/services', element: <AdminServicesPage /> },
              { path: 'banners', element: <AdminBannersPage /> },
              { path: 'reports/directory', element: <AdminReportsPage /> },
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
              { index: true, element: <Navigate to="/provider/identity" replace /> },
              {
                element: <ProviderProfileLayout />,
                children: [
                  { path: 'identity', element: <IdentityPage /> },
                  { path: 'media', element: <MediaPage /> },
                  { path: 'contacts', element: <ContactsPage /> },
                  { path: 'location', element: <LocationPage /> },
                  { path: 'services', element: <ServicesPage /> },
                  { path: 'features', element: <FeaturesPage /> },
                  { path: 'gallery', element: <GalleryPage /> },
                ],
              },
              // Any other /provider/* path → fall back to identity.
              { path: '*', element: <Navigate to="/provider/identity" replace /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
