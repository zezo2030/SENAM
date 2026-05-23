import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Wallet,
  Banknote,
  UserCircle,
  Menu,
  X,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { LangSwitcher } from '@/components/shared/LangSwitcher';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { UserMenu } from '@/components/shared/UserMenu';
import { useRoles } from '@/hooks/useRoles';
import { Button } from '@/components/ui/button';

interface NavItem {
  to: string;
  labelKey: string;
  icon: typeof LayoutDashboard;
  ownerOnly?: boolean;
}

const NAV: NavItem[] = [
  { to: '/provider/overview', labelKey: 'nav.overview', icon: LayoutDashboard },
  { to: '/provider/orders', labelKey: 'nav.orders', icon: ShoppingBag },
  { to: '/provider/staff', labelKey: 'nav.staff', icon: Users, ownerOnly: true },
  { to: '/provider/settlements', labelKey: 'nav.settlements', icon: Wallet },
  { to: '/provider/financials', labelKey: 'nav.financials', icon: Banknote },
  { to: '/provider/profile', labelKey: 'nav.profile', icon: UserCircle },
];

export default function ProviderLayout() {
  const { t } = useTranslation();
  const { has } = useRoles();
  const isOwner = has('provider_owner');
  const [mobileOpen, setMobileOpen] = useState(false);

  const filteredNav = NAV.filter((item) => !item.ownerOnly || isOwner);

  return (
    <div className="flex min-h-screen bg-background relative overflow-hidden">
      {/* Decorative ambient glowing background layers */}
      <div className="absolute top-[20%] start-[-5%] h-[35vw] w-[35vw] rounded-full ambient-glow-purple opacity-45 pointer-events-none" />
      <div className="absolute bottom-[10%] end-[5%] h-[40vw] w-[40vw] rounded-full ambient-glow-blue opacity-40 pointer-events-none" />

      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col glass-sidebar md:flex relative z-30 transition-all duration-300">
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b px-6">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-primary to-indigo-500 flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-primary/20">
              S
            </div>
            <span className="font-black text-xl tracking-tight bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
              {t('app.name')}
            </span>
          </div>
        </div>

        {/* Sidebar Nav links */}
        <nav className="flex-1 space-y-1 p-4 overflow-y-auto max-h-[calc(100vh-4rem)]">
          {filteredNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 group relative',
                  isActive
                    ? 'bg-gradient-to-r from-primary to-indigo-600 text-white shadow-md shadow-primary/15'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground hover:translate-x-1 rtl:hover:-translate-x-1',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn(
                    'h-4 w-4 transition-transform duration-300 group-hover:scale-110',
                    isActive ? 'text-white' : 'text-muted-foreground group-hover:text-foreground'
                  )} />
                  <span className="flex-1 truncate">{t(item.labelKey)}</span>
                  
                  {/* Glowing active indicator dot */}
                  {isActive && (
                    <span className="absolute end-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Mobile Drawer (Glass Panel) */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      
      <aside className={cn(
        'fixed top-0 bottom-0 start-0 w-64 glass-sidebar flex flex-col z-50 transition-transform duration-300 md:hidden',
        mobileOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full'
      )}>
        {/* Brand Mobile Header */}
        <div className="flex h-16 items-center justify-between border-b px-6">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-primary to-indigo-500 flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-primary/20">
              S
            </div>
            <span className="font-black text-xl tracking-tight bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
              {t('app.name')}
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full" 
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Mobile Navigation */}
        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          {filteredNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 group',
                  isActive
                    ? 'bg-gradient-to-r from-primary to-indigo-600 text-white shadow-md shadow-primary/15'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )
              }
            >
              <item.icon className="h-4 w-4" />
              <span>{t(item.labelKey)}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden min-h-screen relative z-10">
        
        {/* Modern Floating Header */}
        <header className="glass-header flex h-16 items-center justify-between px-6 shadow-sm border-b border-border/40">
          <div className="flex items-center gap-3 md:hidden">
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-xl border-border/60 hover:bg-muted transition-colors"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <span className="font-extrabold text-lg bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
              {t('app.name')}
            </span>
          </div>
          
          <div className="hidden md:block">
            <span className="text-xs font-semibold text-muted-foreground tracking-widest uppercase">
              {t('app.tagline', { defaultValue: 'لوحة التحكم لمزود الخدمة' })}
            </span>
          </div>

          <div className="flex-1" />

          {/* User Widgets Panel */}
          <div className="flex items-center gap-3">
            <div className="glass-panel rounded-full p-1 flex gap-1 shadow-sm">
              <LangSwitcher />
              <ThemeToggle />
            </div>
            <div className="border-s border-border/60 h-6 mx-1" />
            <UserMenu />
          </div>
        </header>

        {/* Content Wrapper with Fade-in and Scroll view */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 animate-fade-in">
          <div className="w-full animate-slide-up">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
