import { RouterProvider } from 'react-router-dom';
import { I18nProvider } from '@/providers/I18nProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { router } from '@/routes';

export default function App() {
  return (
    <I18nProvider>
      <ThemeProvider>
        <QueryProvider>
          <AuthProvider>
            <RouterProvider router={router} future={{ v7_startTransition: true }} />
          </AuthProvider>
        </QueryProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}
