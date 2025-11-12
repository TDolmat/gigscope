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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-white">
      {/* Gradient mesh background */}
      <div className="fixed inset-0 gradient-mesh pointer-events-none opacity-60" />
      
      {/* Header - Sticky Glass Navbar */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="transition-all duration-200 hover:opacity-80">
            <h1 className="text-xl font-extrabold bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent mb-0.5">
              GigScope
            </h1>
            <p className="text-xs text-gray-500 font-medium">Panel zarządzania</p>
          </Link>
          <Link href="/">
            <Button variant="outline" size="md">
              ← Powrót
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-6 py-12">
        {/* Title */}
        <div className="mb-12 text-center animate-fadeInUp">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50/80 rounded-full border border-blue-100/50 mb-6">
            <span className="text-lg">⚙️</span>
            <span className="text-sm font-semibold text-blue-700">Panel Administracyjny</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
            Zarządzanie konfiguracją
          </h1>
          <p className="text-lg text-gray-600 font-medium max-w-2xl mx-auto">
            Zarządzaj kategoriami i platformami wyświetlanymi w aplikacji
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full animate-pulse shadow-xl"></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-scaleIn">
            {/* Categories Section */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 border border-blue-100/50 shadow-xl shadow-blue-500/10">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <span className="text-2xl">📁</span>
                Kategorie
              </h2>
              
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
                  <div className="text-center py-12 text-gray-500 text-base font-medium border-2 border-dashed border-blue-200 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50">
                    Brak kategorii. Dodaj pierwszą kategorię powyżej.
                  </div>
                ) : (
                  categories.map((category, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50/50 to-cyan-50/30 rounded-xl border border-blue-100 shadow-sm hover:shadow-md transition-all duration-200"
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
                            Zapisz
                          </Button>
                          <Button onClick={cancelEditCategory} variant="ghost" size="sm">
                            Anuluj
                          </Button>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 text-base font-bold text-slate-800">
                            {category}
                          </span>
                          <Button
                            onClick={() => startEditCategory(index)}
                            variant="outline"
                            size="sm"
                          >
                            Edytuj
                          </Button>
                          <Button
                            onClick={() => deleteCategory(index)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            Usuń
                          </Button>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Platforms Section */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 border border-blue-100/50 shadow-xl shadow-blue-500/10">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <span className="text-2xl">🌐</span>
                Platformy
              </h2>
              
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
                  <div className="text-center py-12 text-gray-500 text-base font-medium border-2 border-dashed border-blue-200 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50">
                    Brak platform. Dodaj pierwszą platformę powyżej.
                  </div>
                ) : (
                  platforms.map((platform, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-4 bg-gradient-to-r from-cyan-50/50 to-blue-50/30 rounded-xl border border-blue-100 shadow-sm hover:shadow-md transition-all duration-200"
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
                            Zapisz
                          </Button>
                          <Button onClick={cancelEditPlatform} variant="ghost" size="sm">
                            Anuluj
                          </Button>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 text-base font-bold text-slate-800">
                            {platform}
                          </span>
                          <Button
                            onClick={() => startEditPlatform(index)}
                            variant="outline"
                            size="sm"
                          >
                            Edytuj
                          </Button>
                          <Button
                            onClick={() => deletePlatform(index)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            Usuń
                          </Button>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Save Button */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 border border-blue-100/50 shadow-xl shadow-blue-500/10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Button
                  onClick={saveChanges}
                  variant="primary"
                  size="lg"
                  loading={saving}
                  disabled={saving}
                >
                  {saving ? 'Zapisywanie...' : 'Zapisz wszystkie zmiany'}
                </Button>
                
                {success && (
                  <div className="px-5 py-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-900 font-semibold flex items-center gap-2 animate-fadeInUp">
                    <span className="text-lg">✓</span>
                    Zapisano pomyślnie
                  </div>
                )}
                
                {error && (
                  <div className="px-5 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-900 font-semibold animate-fadeInUp">
                    {error}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative border-t border-blue-100/30 mt-20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-extrabold bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent mb-1">
                GigScope
              </h3>
              <p className="text-xs text-gray-500">Panel Administracyjny</p>
            </div>
            <p className="text-sm text-gray-600">© 2025 GigScope. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
