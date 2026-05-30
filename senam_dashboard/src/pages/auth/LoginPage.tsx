import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Loader2, ShieldCheck, UserCheck } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { LangSwitcher } from '@/components/shared/LangSwitcher';
import { ThemeToggle } from '@/components/shared/ThemeToggle';

import { usePasswordLogin } from '@/api/auth.api';
import { useAuth } from '@/hooks/useAuth';
import { ApiError } from '@/lib/api/client';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  principal: z.enum(['admin', 'provider']),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { t } = useTranslation(['auth', 'common']);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login, user } = useAuth();
  const passwordLogin = usePasswordLogin();
  const from = (location.state as { from?: string } | null)?.from;
  const initialPrincipal = from?.startsWith('/provider') ? 'provider' : 'admin';

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', principal: initialPrincipal },
  });

  if (isAuthenticated && user) {
    const target = user.principal === 'provider' ? '/provider/identity' : '/admin/overview';
    return <Navigate to={target} replace />;
  }

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const tokens = await passwordLogin.mutateAsync({
        email: values.email,
        password: values.password,
        principal: values.principal,
      });
      login(tokens);
      const fallback =
        values.principal === 'provider' ? '/provider/identity' : '/admin/overview';
      const target = from?.startsWith(`/${values.principal}`) ? from : fallback;
      navigate(target, { replace: true });
    } catch (err) {
      const message =
        err instanceof ApiError && err.status === 401
          ? t('invalidCredentials')
          : err instanceof Error
            ? err.message
            : t('loginFailed');
      toast.error(message);
    }
  });

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-6 overflow-hidden">
      {/* Decorative ambient glowing backdrops */}
      <div className="absolute top-[-10%] start-[-10%] h-[50vw] w-[50vw] rounded-full ambient-glow-purple opacity-70 pointer-events-none" />
      <div className="absolute bottom-[-10%] end-[-10%] h-[50vw] w-[50vw] rounded-full ambient-glow-blue opacity-70 pointer-events-none" />

      {/* Floating Header Controls */}
      <div className="absolute end-6 top-6 flex gap-3 z-50">
        <div className="glass-panel rounded-full p-1.5 flex gap-1.5 shadow-sm">
          <LangSwitcher />
          <ThemeToggle />
        </div>
      </div>

      <div className="w-full max-w-md z-10 animate-slide-up">
        {/* Brand Logotype */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-primary via-violet-500 to-indigo-500 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-primary/20 mb-4 transform hover:rotate-12 transition-transform duration-300">
            S
          </div>
          <h2 className="text-3xl font-black tracking-tight bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent font-sans">
            {t('app.name', { defaultValue: 'لوحة سنام' })}
          </h2>
          <p className="text-sm text-muted-foreground mt-2 text-center font-medium">
            {t('app.tagline', { defaultValue: 'منصة الخدمات الذكية والتحليلات الشاملة' })}
          </p>
        </div>

        {/* Frosted Glass Login Card */}
        <Card className="glass-panel border-white/10 shadow-2xl relative overflow-hidden rounded-2xl glow-hover">
          <div className="absolute top-0 start-0 w-full h-[3px] bg-gradient-to-r from-violet-500 via-primary to-indigo-500" />
          
          <CardHeader className="pt-8 pb-6">
            <CardTitle className="text-xl font-bold text-center tracking-wide">
              {t('title')}
            </CardTitle>
            <CardDescription className="text-center mt-1">
              {t('subtitle')}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="px-8 pb-8">
            <form onSubmit={onSubmit} className="space-y-5">
              
              {/* Custom Role Tabs Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold tracking-wide text-muted-foreground">
                  {t('principal')}
                </Label>
                <Tabs
                  value={form.watch('principal')}
                  onValueChange={(v) =>
                    form.setValue('principal', v as 'admin' | 'provider', {
                      shouldDirty: true,
                    })
                  }
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-xl">
                    <TabsTrigger 
                      value="admin" 
                      className="rounded-lg flex items-center justify-center gap-1.5 py-2 transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      <span>{t('principal.admin')}</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="provider" 
                      className="rounded-lg flex items-center justify-center gap-1.5 py-2 transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      <UserCheck className="h-4 w-4" />
                      <span>{t('principal.provider')}</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Email Input */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-semibold tracking-wide text-muted-foreground">
                  {t('email')}
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="rounded-xl border-border bg-background/50 focus:bg-background transition-all focus:ring-2 focus:ring-primary/20 h-11"
                  placeholder={t('emailPlaceholder')}
                  {...form.register('email')}
                />
                {form.formState.errors.email ? (
                  <p className="text-xs text-destructive mt-1 font-medium">{t('invalidEmail')}</p>
                ) : null}
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-semibold tracking-wide text-muted-foreground">
                  {t('password')}
                </Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  className="rounded-xl border-border bg-background/50 focus:bg-background transition-all focus:ring-2 focus:ring-primary/20 h-11"
                  placeholder={t('passwordPlaceholder')}
                  {...form.register('password')}
                />
                {form.formState.errors.password ? (
                  <p className="text-xs text-destructive mt-1 font-medium">{t('invalidPassword')}</p>
                ) : null}
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-600/95 text-white font-semibold rounded-xl h-11 shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] mt-6 flex items-center justify-center gap-2" 
                disabled={passwordLogin.isPending}
              >
                {passwordLogin.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : null}
                <span>{t('signIn')}</span>
              </Button>
              
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
