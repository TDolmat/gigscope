'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { LogOut } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const isActive = (path: string) => {
    return pathname === path || (pathname === '/admin' && path === '/admin/dashboard');
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
        {/* Top Header */}
        <header className="bg-white shadow-sm">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">GigScope Admin</h1>
              <p className="text-xs text-gray-500">Panel zarządzania</p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="outline" size="sm">
                  ← Strona główna
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-1" />
                Wyloguj
              </Button>
            </div>
          </div>
        </header>

        <div className="flex">
          {/* Sidebar */}
          <aside className="w-64 bg-white shadow-sm min-h-screen">
            <nav className="p-4 space-y-1">
              <Link href="/admin/dashboard">
                <button
                  className={`w-full text-left px-4 py-2.5 rounded text-sm transition-colors ${
                    isActive('/admin/dashboard')
                      ? 'bg-blue-600 text-white font-medium' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Dashboard
                </button>
              </Link>
              
              <Link href="/admin/settings">
                <button
                  className={`w-full text-left px-4 py-2.5 rounded text-sm transition-colors ${
                    isActive('/admin/settings')
                      ? 'bg-blue-600 text-white font-medium' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Ustawienia ogólne
                </button>
              </Link>
              
              <Link href="/admin/users">
                <button
                  className={`w-full text-left px-4 py-2.5 rounded text-sm transition-colors ${
                    isActive('/admin/users')
                      ? 'bg-blue-600 text-white font-medium' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Użytkownicy
                </button>
              </Link>
              
              <Link href="/admin/scrape">
                <button
                  className={`w-full text-left px-4 py-2.5 rounded text-sm transition-colors ${
                    isActive('/admin/scrape')
                      ? 'bg-blue-600 text-white font-medium' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Scrape test
                </button>
              </Link>
              
              <Link href="/admin/mail">
                <button
                  className={`w-full text-left px-4 py-2.5 rounded text-sm transition-colors ${
                    isActive('/admin/mail')
                      ? 'bg-blue-600 text-white font-medium' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Mail
                </button>
              </Link>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-8">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

