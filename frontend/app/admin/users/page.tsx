'use client';

import { useState, useEffect } from 'react';
import { adminUsersApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Edit, Trash2, Calendar, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/app/context/AuthContext';
import { formatDateTime, formatDateShort } from '@/lib/dateUtils';
import { PageHeader, PageLoader } from '@/components/admin';

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
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Nie udało się pobrać listy użytkowników');
    } finally {
      setLoading(false);
    }
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      console.error('Error deleting subscription:', error);
      toast.error('Nie udało się usunąć subskrypcji');
    } finally {
      setUserToDelete(null);
    }
  };

  if (loading) {
    return <PageLoader title="Użytkownicy" />;
  }

  return (
    <div>
      <PageHeader title="Użytkownicy" description="Zarządzaj użytkownikami i ich subskrypcjami" />

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-[#2B2E33] rounded-[1rem] border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#191B1F] border-b border-white/10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white/50 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white/50 uppercase tracking-wider">Preferencje</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white/50 uppercase tracking-wider">Subskrypcja</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white/50 uppercase tracking-wider">Data utworzenia</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-white/50 uppercase tracking-wider">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-white">{user.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <UserPreferencesCell 
                      user={user}
                      isEditing={editingUser === user.id}
                      editMustInclude={editMustInclude}
                      editCanInclude={editCanInclude}
                      editCannotInclude={editCannotInclude}
                      onMustIncludeChange={setEditMustInclude}
                      onCanIncludeChange={setEditCanInclude}
                      onCannotIncludeChange={setEditCannotInclude}
                      onSave={() => handleSavePreferences(user.id)}
                      onCancel={() => setEditingUser(null)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <UserSubscriptionCell 
                      user={user}
                      isEditing={editingSubscription === user.id}
                      editExpiresAt={editExpiresAt}
                      onExpiresAtChange={setEditExpiresAt}
                      onSave={() => handleSaveSubscription(user.id)}
                      onCancel={() => setEditingSubscription(null)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-white/50">{formatDateTime(user.created_at)}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <UserActionsCell 
                      user={user}
                      isEditingPreferences={editingUser === user.id}
                      isEditingSubscription={editingSubscription === user.id}
                      onEditPreferences={() => handleEditPreferences(user)}
                      onEditSubscription={() => handleEditSubscription(user)}
                      onDeleteSubscription={() => handleDeleteSubscription(user.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {users.map((user) => (
          <UserMobileCard 
            key={user.id}
            user={user}
            isEditingPreferences={editingUser === user.id}
            isEditingSubscription={editingSubscription === user.id}
            editMustInclude={editMustInclude}
            editCanInclude={editCanInclude}
            editCannotInclude={editCannotInclude}
            editExpiresAt={editExpiresAt}
            onMustIncludeChange={setEditMustInclude}
            onCanIncludeChange={setEditCanInclude}
            onCannotIncludeChange={setEditCannotInclude}
            onExpiresAtChange={setEditExpiresAt}
            onEditPreferences={() => handleEditPreferences(user)}
            onEditSubscription={() => handleEditSubscription(user)}
            onSavePreferences={() => handleSavePreferences(user.id)}
            onSaveSubscription={() => handleSaveSubscription(user.id)}
            onCancelPreferences={() => setEditingUser(null)}
            onCancelSubscription={() => setEditingSubscription(null)}
            onDeleteSubscription={() => handleDeleteSubscription(user.id)}
          />
        ))}
      </div>

      {users.length === 0 && !loading && (
        <div className="text-center py-12 text-white/50">
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

// Sub-components for cleaner code

interface UserPreferencesCellProps {
  user: UserData;
  isEditing: boolean;
  editMustInclude: string;
  editCanInclude: string;
  editCannotInclude: string;
  onMustIncludeChange: (value: string) => void;
  onCanIncludeChange: (value: string) => void;
  onCannotIncludeChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

function UserPreferencesCell({
  user, isEditing, editMustInclude, editCanInclude, editCannotInclude,
  onMustIncludeChange, onCanIncludeChange, onCannotIncludeChange, onSave, onCancel
}: UserPreferencesCellProps) {
  if (isEditing) {
    return (
      <div className="space-y-2 max-w-md">
        <Input placeholder="Musi zawierać (oddziel spacjami lub przecinkami)" value={editMustInclude} onChange={(e) => onMustIncludeChange(e.target.value)} className="text-sm" />
        <Input placeholder="Może zawierać (oddziel spacjami lub przecinkami)" value={editCanInclude} onChange={(e) => onCanIncludeChange(e.target.value)} className="text-sm" />
        <Input placeholder="Nie może zawierać (oddziel spacjami lub przecinkami)" value={editCannotInclude} onChange={(e) => onCannotIncludeChange(e.target.value)} className="text-sm" />
        <div className="flex gap-2">
          <Button size="sm" onClick={onSave}><Check className="w-4 h-4 mr-1" />Zapisz</Button>
          <Button size="sm" variant="secondary" onClick={onCancel}><X className="w-4 h-4 mr-1" />Anuluj</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-sm text-white/60 space-y-1">
      {user.preferences ? (
        <>
          {user.preferences.must_include_keywords?.length > 0 && (
            <div><span className="font-semibold text-green-400">✓ </span>{user.preferences.must_include_keywords.join(', ')}</div>
          )}
          {user.preferences.can_include_keywords?.length > 0 && (
            <div><span className="font-semibold text-[#60A5FA]">+ </span>{user.preferences.can_include_keywords.join(', ')}</div>
          )}
          {user.preferences.cannot_include_keywords?.length > 0 && (
            <div><span className="font-semibold text-red-400">✗ </span>{user.preferences.cannot_include_keywords.join(', ')}</div>
          )}
        </>
      ) : (
        <span className="text-white/30">Brak preferencji</span>
      )}
    </div>
  );
}

interface UserSubscriptionCellProps {
  user: UserData;
  isEditing: boolean;
  editExpiresAt: string;
  onExpiresAtChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

function UserSubscriptionCell({ user, isEditing, editExpiresAt, onExpiresAtChange, onSave, onCancel }: UserSubscriptionCellProps) {
  if (isEditing) {
    return (
      <div className="space-y-2 max-w-xs">
        <Input type="datetime-local" value={editExpiresAt} onChange={(e) => onExpiresAtChange(e.target.value)} className="text-sm" />
        <div className="flex gap-2">
          <Button size="sm" onClick={onSave}><Check className="w-4 h-4 mr-1" />Zapisz</Button>
          <Button size="sm" variant="secondary" onClick={onCancel}><X className="w-4 h-4 mr-1" />Anuluj</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-sm">
      {user.subscription ? (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              user.subscription.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {user.subscription.is_active ? 'Aktywna' : 'Wygasła'}
            </span>
          </div>
          <div className="text-xs text-white/50">Do: {formatDateTime(user.subscription.expires_at)}</div>
        </div>
      ) : (
        <span className="text-white/30">Brak subskrypcji</span>
      )}
    </div>
  );
}

interface UserActionsCellProps {
  user: UserData;
  isEditingPreferences: boolean;
  isEditingSubscription: boolean;
  onEditPreferences: () => void;
  onEditSubscription: () => void;
  onDeleteSubscription: () => void;
}

function UserActionsCell({ user, isEditingPreferences, isEditingSubscription, onEditPreferences, onEditSubscription, onDeleteSubscription }: UserActionsCellProps) {
  return (
    <div className="flex items-center justify-end gap-2">
      {!isEditingPreferences && <Button size="sm" variant="ghost" onClick={onEditPreferences}><Edit className="w-4 h-4" /></Button>}
      {!isEditingSubscription && (
        <>
          <Button size="sm" variant="ghost" onClick={onEditSubscription}><Calendar className="w-4 h-4" /></Button>
          {user.subscription && <Button size="sm" variant="ghost" onClick={onDeleteSubscription}><Trash2 className="w-4 h-4 text-red-400" /></Button>}
        </>
      )}
    </div>
  );
}

interface UserMobileCardProps {
  user: UserData;
  isEditingPreferences: boolean;
  isEditingSubscription: boolean;
  editMustInclude: string;
  editCanInclude: string;
  editCannotInclude: string;
  editExpiresAt: string;
  onMustIncludeChange: (value: string) => void;
  onCanIncludeChange: (value: string) => void;
  onCannotIncludeChange: (value: string) => void;
  onExpiresAtChange: (value: string) => void;
  onEditPreferences: () => void;
  onEditSubscription: () => void;
  onSavePreferences: () => void;
  onSaveSubscription: () => void;
  onCancelPreferences: () => void;
  onCancelSubscription: () => void;
  onDeleteSubscription: () => void;
}

function UserMobileCard({
  user, isEditingPreferences, isEditingSubscription,
  editMustInclude, editCanInclude, editCannotInclude, editExpiresAt,
  onMustIncludeChange, onCanIncludeChange, onCannotIncludeChange, onExpiresAtChange,
  onEditPreferences, onEditSubscription, onSavePreferences, onSaveSubscription,
  onCancelPreferences, onCancelSubscription, onDeleteSubscription
}: UserMobileCardProps) {
  return (
    <div className="bg-[#2B2E33] rounded-[1rem] border border-white/10 p-4">
      {/* User Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{user.email}</p>
          <p className="text-xs text-white/40 mt-0.5">Utworzono: {formatDateShort(user.created_at)}</p>
        </div>
        <div className="flex items-center gap-1 ml-2">
          {!isEditingPreferences && (
            <button onClick={onEditPreferences} className="p-1.5 text-white/40 hover:text-[#F1E388] hover:bg-white/5 rounded">
              <Edit className="w-4 h-4" />
            </button>
          )}
          {!isEditingSubscription && (
            <>
              <button onClick={onEditSubscription} className="p-1.5 text-white/40 hover:text-[#F1E388] hover:bg-white/5 rounded">
                <Calendar className="w-4 h-4" />
              </button>
              {user.subscription && (
                <button onClick={onDeleteSubscription} className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Subscription Status */}
      <div className="mb-3">
        {isEditingSubscription ? (
          <div className="space-y-2">
            <label className="text-xs font-medium text-white/50">Wygaśnięcie subskrypcji</label>
            <Input type="datetime-local" value={editExpiresAt} onChange={(e) => onExpiresAtChange(e.target.value)} className="text-sm" />
            <div className="flex gap-2">
              <Button size="sm" onClick={onSaveSubscription}><Check className="w-3 h-3 mr-1" />Zapisz</Button>
              <Button size="sm" variant="secondary" onClick={onCancelSubscription}><X className="w-3 h-3 mr-1" />Anuluj</Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {user.subscription ? (
              <>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  user.subscription.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {user.subscription.is_active ? 'Aktywna' : 'Wygasła'}
                </span>
                <span className="text-xs text-white/40">do {formatDateShort(user.subscription.expires_at)}</span>
              </>
            ) : (
              <span className="text-xs text-white/30">Brak subskrypcji</span>
            )}
          </div>
        )}
      </div>

      {/* Preferences */}
      <div className="border-t border-white/5 pt-3">
        {isEditingPreferences ? (
          <div className="space-y-2">
            <Input placeholder="Musi zawierać" value={editMustInclude} onChange={(e) => onMustIncludeChange(e.target.value)} className="text-sm" />
            <Input placeholder="Może zawierać" value={editCanInclude} onChange={(e) => onCanIncludeChange(e.target.value)} className="text-sm" />
            <Input placeholder="Nie może zawierać" value={editCannotInclude} onChange={(e) => onCannotIncludeChange(e.target.value)} className="text-sm" />
            <div className="flex gap-2">
              <Button size="sm" onClick={onSavePreferences}><Check className="w-3 h-3 mr-1" />Zapisz</Button>
              <Button size="sm" variant="secondary" onClick={onCancelPreferences}><X className="w-3 h-3 mr-1" />Anuluj</Button>
            </div>
          </div>
        ) : (
          <div className="text-xs text-white/50 space-y-1">
            {user.preferences ? (
              <>
                {user.preferences.must_include_keywords?.length > 0 && (
                  <div className="flex items-start gap-1">
                    <span className="font-semibold text-green-400 flex-shrink-0">✓</span>
                    <span className="break-words">{user.preferences.must_include_keywords.join(', ')}</span>
                  </div>
                )}
                {user.preferences.can_include_keywords?.length > 0 && (
                  <div className="flex items-start gap-1">
                    <span className="font-semibold text-[#60A5FA] flex-shrink-0">+</span>
                    <span className="break-words">{user.preferences.can_include_keywords.join(', ')}</span>
                  </div>
                )}
                {user.preferences.cannot_include_keywords?.length > 0 && (
                  <div className="flex items-start gap-1">
                    <span className="font-semibold text-red-400 flex-shrink-0">✗</span>
                    <span className="break-words">{user.preferences.cannot_include_keywords.join(', ')}</span>
                  </div>
                )}
                {!user.preferences.must_include_keywords?.length && 
                 !user.preferences.can_include_keywords?.length && 
                 !user.preferences.cannot_include_keywords?.length && (
                  <span className="text-white/30">Brak słów kluczowych</span>
                )}
              </>
            ) : (
              <span className="text-white/30">Brak preferencji</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
