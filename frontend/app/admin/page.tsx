'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { configApi } from '@/lib/api';
import Link from 'next/link';

export default function AdminPage() {
  const [categories, setCategories] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Edit states
  const [editingCategory, setEditingCategory] = useState<number | null>(null);
  const [editingPlatform, setEditingPlatform] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  
  // Add states
  const [newCategory, setNewCategory] = useState('');
  const [newPlatform, setNewPlatform] = useState('');

  // Fetch configs on component mount
  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const data = await configApi.getConfig();
      
      // Parse categories
      if (data.CATEGORIES) {
        if (typeof data.CATEGORIES === 'string') {
          const parsed = data.CATEGORIES.replace(/'/g, '"');
          setCategories(JSON.parse(parsed));
        } else if (Array.isArray(data.CATEGORIES)) {
          setCategories(data.CATEGORIES);
        }
      }
      
      // Parse platforms
      if (data.PLATFORMS) {
        if (typeof data.PLATFORMS === 'string') {
          const parsed = data.PLATFORMS.replace(/'/g, '"');
          setPlatforms(JSON.parse(parsed));
        } else if (Array.isArray(data.PLATFORMS)) {
          setPlatforms(data.PLATFORMS);
        }
      }
    } catch (err) {
      console.error('Error fetching configs:', err);
      setError('Nie udało się pobrać konfiguracji.');
    } finally {
      setLoading(false);
    }
  };

  const saveChanges = async () => {
    setError('');
    setSuccess(false);
    setSaving(true);

    try {
      await configApi.updateConfig({
        CATEGORIES: categories,
        PLATFORMS: platforms
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Wystąpił błąd podczas zapisywania.');
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  // Category functions
  const addCategory = () => {
    if (newCategory.trim()) {
      setCategories([...categories, newCategory.trim()]);
      setNewCategory('');
    }
  };

  const deleteCategory = (index: number) => {
    setCategories(categories.filter((_, i) => i !== index));
  };

  const startEditCategory = (index: number) => {
    setEditingCategory(index);
    setEditValue(categories[index]);
  };

  const saveEditCategory = () => {
    if (editingCategory !== null && editValue.trim()) {
      const newCategories = [...categories];
      newCategories[editingCategory] = editValue.trim();
      setCategories(newCategories);
      setEditingCategory(null);
      setEditValue('');
    }
  };

  const cancelEditCategory = () => {
    setEditingCategory(null);
    setEditValue('');
  };

  // Platform functions
  const addPlatform = () => {
    if (newPlatform.trim()) {
      setPlatforms([...platforms, newPlatform.trim()]);
      setNewPlatform('');
    }
  };

  const deletePlatform = (index: number) => {
    setPlatforms(platforms.filter((_, i) => i !== index));
  };

  const startEditPlatform = (index: number) => {
    setEditingPlatform(index);
    setEditValue(platforms[index]);
  };

  const saveEditPlatform = () => {
    if (editingPlatform !== null && editValue.trim()) {
      const newPlatforms = [...platforms];
      newPlatforms[editingPlatform] = editValue.trim();
      setPlatforms(newPlatforms);
      setEditingPlatform(null);
      setEditValue('');
    }
  };

  const cancelEditPlatform = () => {
    setEditingPlatform(null);
    setEditValue('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-violet-50/30 to-white">
      {/* Gradient mesh background */}
      <div className="fixed inset-0 gradient-mesh pointer-events-none" />
      
      {/* Header */}
      <header className="relative border-b border-gray-200/50 backdrop-blur-sm bg-white/80">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/30 group-hover:shadow-violet-500/50 transition-all">
                <span className="text-white text-xl font-bold">G</span>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                  Gig Scope
                </h1>
                <p className="text-xs text-gray-500 font-medium">Panel administracyjny</p>
              </div>
            </Link>
          </div>
          <Link href="/">
            <Button variant="secondary" size="sm">
              ← Powrót do strony głównej
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-6xl mx-auto px-6 py-12">
        {/* Title */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-100 text-violet-700 rounded-full text-sm font-semibold mb-4 shadow-sm">
            <span>⚙️</span>
            Konfiguracja systemu
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Zarządzanie konfiguracją
          </h1>
          <p className="text-lg text-gray-600">
            Zarządzaj kategoriami i platformami wyświetlanymi w aplikacji.
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-violet-200 border-t-violet-600"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Categories Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 shadow-xl shadow-gray-200/50">
              <div className="flex items-center gap-3 mb-8">
                <span className="text-3xl">📂</span>
                <h2 className="text-2xl font-bold text-gray-900">Kategorie</h2>
              </div>
              
              {/* Add new category */}
              <div className="mb-6 flex gap-3">
                <Input
                  placeholder="Dodaj nową kategorię..."
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                  className="flex-1"
                />
                <Button onClick={addCategory} variant="primary" size="md">
                  + Dodaj
                </Button>
              </div>

              {/* Categories list */}
              <div className="space-y-3">
                {categories.length === 0 ? (
                  <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                    <span className="text-5xl mb-3 block">📦</span>
                    <p className="text-gray-500 font-medium text-sm">
                      Brak kategorii. Dodaj pierwszą kategorię powyżej.
                    </p>
                  </div>
                ) : (
                  categories.map((category, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-4 bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-gray-200 hover:border-violet-300 transition-all"
                    >
                      {editingCategory === index ? (
                        <>
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && saveEditCategory()}
                            className="flex-1"
                            autoFocus
                          />
                          <Button onClick={saveEditCategory} variant="primary" size="sm">
                            ✓ Zapisz
                          </Button>
                          <Button onClick={cancelEditCategory} variant="ghost" size="sm">
                            ✕ Anuluj
                          </Button>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 text-sm font-semibold text-gray-900">
                            {category}
                          </span>
                          <Button
                            onClick={() => startEditCategory(index)}
                            variant="outline"
                            size="sm"
                          >
                            ✏️ Edytuj
                          </Button>
                          <Button
                            onClick={() => deleteCategory(index)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            🗑️ Usuń
                          </Button>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Platforms Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 shadow-xl shadow-gray-200/50">
              <div className="flex items-center gap-3 mb-8">
                <span className="text-3xl">🌐</span>
                <h2 className="text-2xl font-bold text-gray-900">Platformy</h2>
              </div>
              
              {/* Add new platform */}
              <div className="mb-6 flex gap-3">
                <Input
                  placeholder="Dodaj nową platformę..."
                  value={newPlatform}
                  onChange={(e) => setNewPlatform(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addPlatform()}
                  className="flex-1"
                />
                <Button onClick={addPlatform} variant="primary" size="md">
                  + Dodaj
                </Button>
              </div>

              {/* Platforms list */}
              <div className="space-y-3">
                {platforms.length === 0 ? (
                  <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                    <span className="text-5xl mb-3 block">📦</span>
                    <p className="text-gray-500 font-medium text-sm">
                      Brak platform. Dodaj pierwszą platformę powyżej.
                    </p>
                  </div>
                ) : (
                  platforms.map((platform, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-4 bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-gray-200 hover:border-violet-300 transition-all"
                    >
                      {editingPlatform === index ? (
                        <>
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && saveEditPlatform()}
                            className="flex-1"
                            autoFocus
                          />
                          <Button onClick={saveEditPlatform} variant="primary" size="sm">
                            ✓ Zapisz
                          </Button>
                          <Button onClick={cancelEditPlatform} variant="ghost" size="sm">
                            ✕ Anuluj
                          </Button>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 text-sm font-semibold text-gray-900">
                            {platform}
                          </span>
                          <Button
                            onClick={() => startEditPlatform(index)}
                            variant="outline"
                            size="sm"
                          >
                            ✏️ Edytuj
                          </Button>
                          <Button
                            onClick={() => deletePlatform(index)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            🗑️ Usuń
                          </Button>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4">
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 shadow-xl shadow-gray-200/50">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <Button
                    onClick={saveChanges}
                    variant="primary"
                    size="lg"
                    loading={saving}
                    disabled={saving}
                    className="w-full sm:w-auto"
                  >
                    {saving ? 'Zapisywanie...' : '💾 Zapisz wszystkie zmiany'}
                  </Button>
                  
                  {success && (
                    <div className="px-5 py-3 bg-gradient-to-r from-violet-50 to-fuchsia-50 border-2 border-violet-200 rounded-2xl shadow-sm animate-fadeInUp">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🎉</span>
                        <span className="text-sm text-violet-900 font-semibold">
                          Zapisano pomyślnie
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {error && (
                    <div className="px-5 py-3 bg-red-50 border-2 border-red-200 rounded-2xl shadow-sm animate-fadeInUp">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">⚠️</span>
                        <span className="text-sm text-red-900 font-semibold">
                          {error}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative border-t border-gray-200/50 mt-20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">© 2025 Gig Scope. Wszystkie prawa zastrzeżone.</p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-md">
                <span className="text-white text-sm font-bold">G</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
