'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Calendar, Database, Sparkles, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils'; // standard class joiner

interface NavigationProps {
  isMock: boolean;
}

export default function Navigation({ isMock }: NavigationProps) {
  const pathname = usePathname();

  const navItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Calendario',
      href: '/calendar',
      icon: Calendar,
    },
  ];

  return (
    <>
      {/* Desktop Sidebar Navigation */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card text-card-foreground h-screen sticky top-0">
        {/* Brand/Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-semibold tracking-tight text-sm">Aynoa PMS</h1>
              <p className="text-[10px] text-muted-foreground">Premium Edition</p>
            </div>
          </div>
        </div>

        {/* Links */}
        <nav className="flex-1 p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-secondary text-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                )}
              >
                <Icon className={cn('w-4 h-4', isActive ? 'text-primary' : 'text-muted-foreground')} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* DB Connection Status Widget */}
        <div className="p-4 border-t border-border bg-muted/40">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border bg-card">
            <Database className={cn('w-4 h-4 shrink-0', isMock ? 'text-amber-500' : 'text-emerald-500')} />
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold truncate">
                {isMock ? 'Base de Datos: Mock' : 'PostgreSQL Activo'}
              </div>
              <div className="text-[9px] text-muted-foreground truncate">
                {isMock ? 'Usando demo en memoria' : 'Conectado a Vercel/Supabase'}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-border bg-card/85 backdrop-blur-md z-50 flex justify-around items-center px-4 pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center w-20 h-12 rounded-xl transition-all active:scale-95 duration-100"
              style={{ minWidth: '44px', minHeight: '44px' }} // Touch target size
            >
              <Icon
                className={cn(
                  'w-5 h-5 mb-1 transition-colors',
                  isActive ? 'text-primary scale-110' : 'text-muted-foreground'
                )}
              />
              <span
                className={cn(
                  'text-[10px] font-medium tracking-tight transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
        {/* DB Status Dot for Mobile */}
        <div className="flex flex-col items-center justify-center w-16 h-12">
          <div
            className={cn(
              'w-2 h-2 rounded-full ring-4',
              isMock
                ? 'bg-amber-500 ring-amber-500/20'
                : 'bg-emerald-500 ring-emerald-500/20'
            )}
          />
          <span className="text-[8px] text-muted-foreground mt-1.5 font-medium uppercase tracking-wider">
            {isMock ? 'Demo' : 'Live'}
          </span>
        </div>
      </nav>
    </>
  );
}
