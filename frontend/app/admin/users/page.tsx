'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminUsersApi } from '@/lib/api';
import { useAuth } from '@/app/context/AuthContext';
import { toast } from 'sonner';
import { PageHeader, PageLoader } from '@/components/admin';
import { formatDateTime } from '@/lib/dateUtils';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Search, Users, Mail, Edit2, X, Check, ToggleLeft, ToggleRight, Tag, ChevronLeft, ChevronRight } from 'lucide-react';

interface UserPreferences {
  must_contain: string[];
  may_contain: string[];
  must_not_contain: string[];
}

interface EditPreferences {
  must_contain: string;
  may_contain: string;
  must_not_contain: string;
}

interface User {
  id: number;
  email: string;
  created_at: string;
  updated_at: string;
  is_subscribed: boolean;
  preferences: UserPreferences | null;
}

export default function UsersPage() {
  const { authenticatedFetch } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [editingUser, setEditingUser] = useState<number | null>(null);
  const [editPreferences, setEditPreferences] = useState<EditPreferences | null>(null);
  const [saving, setSaving] = useState(false);
  const [togglingSubscription, setTogglingSubscription] = useState<number | null>(null);

  const fetchUsers = useCallback(async (searchTerm: string, pageNum: number) => {
    try {
      setLoading(true);
      const result = await adminUsersApi.getUsers(pageNum, 25, searchTerm, authenticatedFetch);
      setUsers(result.users || []);
      setTotalPages(result.pagination?.pages || 1);
      setTotal(result.pagination?.total || 0);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Nie udało się pobrać użytkowników');
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch]);

  useEffect(() => {
    fetchUsers(search, page);
  }, [page]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchUsers(search, 1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, fetchUsers]);

  const startEditing = (user: User) => {
    setEditingUser(user.id);
    // Convert arrays to comma-separated strings for editing
    setEditPreferences({
      must_contain: user.preferences?.must_contain?.join(', ') || '',
      may_contain: user.preferences?.may_contain?.join(', ') || '',
      must_not_contain: user.preferences?.must_not_contain?.join(', ') || '',
    });
  };

  const cancelEditing = () => {
    setEditingUser(null);
    setEditPreferences(null);
  };

  const savePreferences = async (userId: number) => {
    if (!editPreferences) return;

    // Convert comma-separated strings to arrays
    const preferencesArray: UserPreferences = {
      must_contain: editPreferences.must_contain.split(',').map(k => k.trim()).filter(k => k),
      may_contain: editPreferences.may_contain.split(',').map(k => k.trim()).filter(k => k),
      must_not_contain: editPreferences.must_not_contain.split(',').map(k => k.trim()).filter(k => k),
    };

    try {
      setSaving(true);
      await adminUsersApi.updateUserPreferences(userId, preferencesArray, authenticatedFetch);
      
      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === userId 
          ? { ...u, preferences: preferencesArray, is_subscribed: true }
          : u
      ));
      
      toast.success('Preferencje zostały zapisane');
      cancelEditing();
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Nie udało się zapisać preferencji');
    } finally {
      setSaving(false);
    }
  };

  const toggleSubscription = async (user: User) => {
    try {
      setTogglingSubscription(user.id);
      const result = await adminUsersApi.toggleSubscription(user.id, authenticatedFetch);
      
      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === user.id 
          ? { ...u, is_subscribed: result.is_subscribed }
          : u
      ));
      
      toast.success(result.is_subscribed ? 'Użytkownik zapisany' : 'Użytkownik wypisany');
    } catch (error) {
      console.error('Error toggling subscription:', error);
      toast.error('Nie udało się zmienić statusu subskrypcji');
    } finally {
      setTogglingSubscription(null);
    }
  };

  const updateKeywords = (field: keyof EditPreferences, value: string) => {
    if (!editPreferences) return;
    
    // Just store the raw string - parsing happens on save
    setEditPreferences({
      ...editPreferences,
      [field]: value,
    });
  };

  const formatKeywords = (keywords: string[] | null | undefined): string => {
    if (!keywords || keywords.length === 0) return '-';
    return keywords.join(', ');
  };

  if (loading && users.length === 0) {
    return <PageLoader title="Użytkownicy" />;
  }

  return (
    <div className="min-h-[calc(100vh-180px)]">
      <PageHeader 
        title="Użytkownicy" 
        description="Zarządzaj użytkownikami i ich preferencjami słów kluczowych"
      />

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Szukaj po adresie email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12"
          />
        </div>
        <p className="mt-2 text-sm text-gray-400">
          Znaleziono <span className="text-white font-medium">{total}</span> użytkowników
        </p>
      </div>

      {users.length === 0 ? (
        <div className="bg-cards-background rounded-xl shadow-xl shadow-black/20 border border-gray-700 p-8 text-center">
          <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Brak użytkowników</h3>
          <p className="text-gray-400">
            {search ? 'Nie znaleziono użytkowników pasujących do wyszukiwania' : 'Użytkownicy pojawią się tutaj po zapisaniu do newslettera'}
          </p>
        </div>
      ) : (
        <>
          {/* Users Table */}
          <div className="bg-cards-background rounded-xl shadow-xl shadow-black/20 border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr className="border-b border-gray-700">
                    <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="text-center px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Musi zawierać
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Może zawierać
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Nie może zawierać
                    </th>
                    <th className="text-center px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Akcje
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-700/50 rounded-lg flex-shrink-0">
                            <Mail className="w-4 h-4 text-gray-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-white font-medium truncate">{user.email}</p>
                            <p className="text-xs text-gray-500">
                              Dodany: {formatDateTime(user.created_at).split(' ')[0]}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => toggleSubscription(user)}
                          disabled={togglingSubscription === user.id}
                          className="inline-flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                          title={user.is_subscribed ? 'Kliknij aby wypisać' : 'Kliknij aby zapisać'}
                        >
                          {togglingSubscription === user.id ? (
                            <svg className="animate-spin h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                          ) : user.is_subscribed ? (
                            <ToggleRight className="w-6 h-6 text-green-400" />
                          ) : (
                            <ToggleLeft className="w-6 h-6 text-gray-500" />
                          )}
                          <span className={`text-xs font-medium ${user.is_subscribed ? 'text-green-400' : 'text-gray-500'}`}>
                            {user.is_subscribed ? 'Aktywny' : 'Nieaktywny'}
                          </span>
                        </button>
                      </td>
                      
                      {editingUser === user.id ? (
                        <>
                          <td className="px-5 py-4">
                            <input
                              type="text"
                              value={editPreferences?.must_contain || ''}
                              onChange={(e) => updateKeywords('must_contain', e.target.value)}
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                              placeholder="słowo1, słowo2..."
                            />
                          </td>
                          <td className="px-5 py-4">
                            <input
                              type="text"
                              value={editPreferences?.may_contain || ''}
                              onChange={(e) => updateKeywords('may_contain', e.target.value)}
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                              placeholder="słowo1, słowo2..."
                            />
                          </td>
                          <td className="px-5 py-4">
                            <input
                              type="text"
                              value={editPreferences?.must_not_contain || ''}
                              onChange={(e) => updateKeywords('must_not_contain', e.target.value)}
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                              placeholder="słowo1, słowo2..."
                            />
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => savePreferences(user.id)}
                                disabled={saving}
                                className="p-2 text-green-400 hover:bg-green-400/10 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                title="Zapisz"
                              >
                                {saving ? (
                                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                  </svg>
                                ) : (
                                  <Check className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="p-2 text-gray-400 hover:bg-gray-400/10 rounded-lg transition-colors cursor-pointer"
                                title="Anuluj"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-5 py-4">
                            <KeywordBadges keywords={user.preferences?.must_contain} color="yellow" />
                          </td>
                          <td className="px-5 py-4">
                            <KeywordBadges keywords={user.preferences?.may_contain} color="blue" />
                          </td>
                          <td className="px-5 py-4">
                            <KeywordBadges keywords={user.preferences?.must_not_contain} color="red" />
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-center">
                              <button
                                onClick={() => startEditing(user)}
                                className="p-2 text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10 rounded-lg transition-colors cursor-pointer"
                                title="Edytuj słowa kluczowe"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-400">
                Strona {page} z {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  variant="secondary"
                  size="sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  variant="secondary"
                  size="sm"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Helper component for keyword badges
function KeywordBadges({ keywords, color }: { keywords: string[] | null | undefined; color: 'yellow' | 'blue' | 'red' }) {
  if (!keywords || keywords.length === 0) {
    return <span className="text-gray-500 text-sm">-</span>;
  }

  const colorClasses = {
    yellow: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
    blue: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
    red: 'bg-red-400/10 text-red-400 border-red-400/20',
  };

  return (
    <div className="flex flex-wrap gap-1">
      {keywords.slice(0, 3).map((keyword, idx) => (
        <span
          key={idx}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs border ${colorClasses[color]}`}
        >
          <Tag className="w-3 h-3" />
          {keyword}
        </span>
      ))}
      {keywords.length > 3 && (
        <span className="text-xs text-gray-500">+{keywords.length - 3}</span>
      )}
    </div>
  );
}

