'use client';

import { useState, useEffect } from 'react';
import { adminUsersApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Edit, Trash2, Calendar, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/app/context/AuthContext';

interface UserData {
  id: number;
  email: string;
  created_at: string | null;
  updated_at: string | null;
  preferences: {
    id: number | null;
    must_include_keywords: string[];
    can_include_keywords: string[];
    cannot_include_keywords: string[];
    created_at: string | null;
    updated_at: string | null;
    deleted_at: string | null;
  } | null;
  subscription: {
    id: number | null;
    subscribed_at: string | null;
    expires_at: string | null;
    is_active: boolean;
  } | null;
}

export default function UsersPage() {
  const { authenticatedFetch } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<number | null>(null);
  const [editingSubscription, setEditingSubscription] = useState<number | null>(null);
  const [editMustInclude, setEditMustInclude] = useState('');
  const [editCanInclude, setEditCanInclude] = useState('');
  const [editCannotInclude, setEditCannotInclude] = useState('');
  const [editExpiresAt, setEditExpiresAt] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminUsersApi.getUsers(authenticatedFetch);
      setUsers(data);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error('Nie udało się pobrać listy użytkowników');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoString: string | null): string => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleString('pl-PL', {
      timeZone: 'Europe/Warsaw',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleEditPreferences = (user: UserData) => {
    setEditingUser(user.id);
    setEditMustInclude(user.preferences?.must_include_keywords?.join(', ') || '');
    setEditCanInclude(user.preferences?.can_include_keywords?.join(', ') || '');
    setEditCannotInclude(user.preferences?.cannot_include_keywords?.join(', ') || '');
  };

  const handleSavePreferences = async (userId: number) => {
    try {
      const mustInclude = editMustInclude.split(',').map(k => k.trim()).filter(k => k);
      const canInclude = editCanInclude.split(',').map(k => k.trim()).filter(k => k);
      const cannotInclude = editCannotInclude.split(',').map(k => k.trim()).filter(k => k);

      await adminUsersApi.updatePreferences(userId, mustInclude, canInclude, cannotInclude, authenticatedFetch);
      toast.success('Preferencje zostały zaktualizowane');
      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error('Error updating preferences:', error);
      toast.error('Nie udało się zaktualizować preferencji');
    }
  };

  const handleEditSubscription = (user: UserData) => {
    setEditingSubscription(user.id);
    if (user.subscription?.expires_at) {
      const date = new Date(user.subscription.expires_at);
      const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
      setEditExpiresAt(localDate.toISOString().slice(0, 16));
    } else {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const localDate = new Date(futureDate.getTime() - futureDate.getTimezoneOffset() * 60000);
      setEditExpiresAt(localDate.toISOString().slice(0, 16));
    }
  };

  const handleSaveSubscription = async (userId: number) => {
    try {
      if (!editExpiresAt) {
        toast.error('Podaj datę wygaśnięcia');
        return;
      }

      const localDate = new Date(editExpiresAt);
      const utcDate = new Date(localDate.getTime() + localDate.getTimezoneOffset() * 60000);
      
      await adminUsersApi.setSubscription(userId, utcDate.toISOString(), authenticatedFetch);
      toast.success('Subskrypcja została zaktualizowana');
      setEditingSubscription(null);
      fetchUsers();
    } catch (error: any) {
      console.error('Error updating subscription:', error);
      toast.error('Nie udało się zaktualizować subskrypcji');
    }
  };

  const handleDeleteSubscription = async (userId: number) => {
    setUserToDelete(userId);
    setDeleteModalOpen(true);
  };

  const confirmDeleteSubscription = async () => {
    if (!userToDelete) return;

    try {
      await adminUsersApi.deleteSubscription(userToDelete, authenticatedFetch);
      toast.success('Subskrypcja została usunięta');
      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting subscription:', error);
      toast.error('Nie udało się usunąć subskrypcji');
    } finally {
      setUserToDelete(null);
    }
  };

  if (loading) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Użytkownicy</h2>
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Użytkownicy</h2>
        <p className="text-gray-600">Zarządzaj użytkownikami i ich subskrypcjami</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Preferencje
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Subskrypcja
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Data utworzenia
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Akcje
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{user.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    {editingUser === user.id ? (
                      <div className="space-y-2 max-w-md">
                        <Input
                          placeholder="Musi zawierać (oddziel przecinkami)"
                          value={editMustInclude}
                          onChange={(e) => setEditMustInclude(e.target.value)}
                          className="text-sm"
                        />
                        <Input
                          placeholder="Może zawierać (oddziel przecinkami)"
                          value={editCanInclude}
                          onChange={(e) => setEditCanInclude(e.target.value)}
                          className="text-sm"
                        />
                        <Input
                          placeholder="Nie może zawierać (oddziel przecinkami)"
                          value={editCannotInclude}
                          onChange={(e) => setEditCannotInclude(e.target.value)}
                          className="text-sm"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSavePreferences(user.id)}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Zapisz
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setEditingUser(null)}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Anuluj
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600 space-y-1">
                        {user.preferences ? (
                          <>
                            {user.preferences.must_include_keywords?.length > 0 && (
                              <div>
                                <span className="font-semibold text-green-600">✓ </span>
                                {user.preferences.must_include_keywords.join(', ')}
                              </div>
                            )}
                            {user.preferences.can_include_keywords?.length > 0 && (
                              <div>
                                <span className="font-semibold text-blue-600">+ </span>
                                {user.preferences.can_include_keywords.join(', ')}
                              </div>
                            )}
                            {user.preferences.cannot_include_keywords?.length > 0 && (
                              <div>
                                <span className="font-semibold text-red-600">✗ </span>
                                {user.preferences.cannot_include_keywords.join(', ')}
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-400">Brak preferencji</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingSubscription === user.id ? (
                      <div className="space-y-2 max-w-xs">
                        <Input
                          type="datetime-local"
                          value={editExpiresAt}
                          onChange={(e) => setEditExpiresAt(e.target.value)}
                          className="text-sm"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSaveSubscription(user.id)}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Zapisz
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setEditingSubscription(null)}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Anuluj
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm">
                        {user.subscription ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                user.subscription.is_active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {user.subscription.is_active ? 'Aktywna' : 'Wygasła'}
                              </span>
                            </div>
                            <div className="text-xs text-gray-600">
                              Do: {formatDate(user.subscription.expires_at)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Brak subskrypcji</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600">
                      {formatDate(user.created_at)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {editingUser !== user.id && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditPreferences(user)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      {editingSubscription !== user.id && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditSubscription(user)}
                          >
                            <Calendar className="w-4 h-4" />
                          </Button>
                          {user.subscription && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteSubscription(user.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {users.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          Brak użytkowników w bazie danych
        </div>
      )}

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDeleteSubscription}
        title="Usuń subskrypcję"
        description="Czy na pewno chcesz usunąć tę subskrypcję? Tej operacji nie można cofnąć."
        confirmText="Usuń"
        cancelText="Anuluj"
        variant="danger"
      />
    </div>
  );
}

