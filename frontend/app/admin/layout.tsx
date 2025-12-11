'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LogOut, Menu, X, LayoutDashboard, Settings, Search, Mail, Home, Play, FileText } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const isActive = (path: string) => {
    return pathname === path || (pathname === '/admin' && path === '/admin/dashboard');
  };

  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/settings', label: 'Ustawienia', icon: Settings },
    { path: '/admin/scrape', label: 'Scrape', icon: Search },
    { path: '/admin/mail', label: 'Mail', icon: Mail },
    { path: '/admin/manual-runs', label: 'Ręczne uruchamianie', icon: Play },
    { path: '/admin/logs', label: 'Logi', icon: FileText },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#191B1F]">
        {/* Top Header */}
        <header className="bg-[#2B2E33] border-b border-white/5 sticky top-0 z-50">
          <div className="px-3 sm:px-6 py-2.5 sm:py-4 flex items-center justify-between gap-2">
            {/* Left side - Menu button + Logo */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 -ml-1 text-white/60 hover:text-[#F1E388] hover:bg-white/5 rounded-lg transition-colors flex-shrink-0"
                aria-label="Menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
              
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold text-white truncate">
                  <span className="sm:hidden font-[family-name:var(--font-permanent-marker)] text-[#F1E388]">AI Scoper</span>
                  <span className="hidden sm:inline">
                    <span className="font-[family-name:var(--font-permanent-marker)] text-[#F1E388]">AI Scoper</span>
                    <span className="text-white/50 font-normal ml-2">Admin</span>
                  </span>
                </h1>
                <p className="text-xs text-white/40 hidden md:block">Panel zarządzania</p>
              </div>
            </div>
            
            {/* Right side - Action buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              {/* Home button - icon only on mobile */}
              <Link href="/">
                <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white/70 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:text-white transition-colors">
                  <Home className="w-4 h-4" />
                  <span>Strona główna</span>
                </button>
                <button className="sm:hidden p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                  <Home className="w-5 h-5" />
                </button>
              </Link>
              
              {/* Logout button - icon only on mobile */}
              <button 
                onClick={handleLogout}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white/70 bg-white/5 border border-white/10 rounded-lg hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Wyloguj</span>
              </button>
              <button 
                onClick={handleLogout}
                className="sm:hidden p-2 text-white/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <div className="flex">
          {/* Mobile Overlay */}
          {mobileMenuOpen && (
            <div 
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}

          {/* Sidebar */}
          <aside className={`
            fixed lg:sticky lg:top-0 left-0 z-40 lg:z-auto
            w-[220px] sm:w-64 bg-[#2B2E33] border-r border-white/5
            h-[100dvh] lg:h-auto lg:min-h-screen
            transform transition-transform duration-300 ease-in-out
            ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}>
            {/* Mobile header in sidebar */}
            <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-white/5">
              <span className="font-semibold text-white">Menu</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-white/50 hover:text-white hover:bg-white/5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <nav className="p-3 sm:p-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      router.push(item.path);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 sm:px-4 py-2.5 rounded-[0.75rem] text-sm transition-colors flex items-center gap-3 ${
                      isActive(item.path)
                        ? 'bg-[#F1E388] text-[#191B1F] font-medium' 
                        : 'text-white/70 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>
            
            {/* Mobile logout in sidebar */}
            <div className="lg:hidden absolute bottom-0 left-0 right-0 p-3 border-t border-white/5 bg-[#2B2E33]">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-[0.75rem] transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Wyloguj się
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full min-w-0 overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
