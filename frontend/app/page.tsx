'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { categoriesApi, subscriptionApi } from '@/lib/api';

export default function Home() {
  const [email, setEmail] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoriesApi.getCategories();
        setCategories(data);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Nie udało się pobrać kategorii. Spróbuj ponownie później.');
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Email validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle category toggle
  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEmailError('');
    setSuccess(false);

    // Validation
    if (!email) {
      setEmailError('Adres email jest wymagany');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Wprowadź poprawny adres email');
      return;
    }

    if (selectedCategories.length === 0) {
      setError('Wybierz przynajmniej jedną kategorię');
      return;
    }

    setLoading(true);

    try {
      await subscriptionApi.subscribe(email, selectedCategories);
      setSuccess(true);
      setEmail('');
      setSelectedCategories([]);
      
      // Reset success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError('Wystąpił błąd podczas zapisywania. Spróbuj ponownie.');
      console.error('Subscription error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-violet-50/30 to-white">
      {/* Gradient mesh background */}
      <div className="fixed inset-0 gradient-mesh pointer-events-none" />
      
      {/* Header */}
      <header className="relative border-b border-gray-200/50 backdrop-blur-sm bg-white/80">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <span className="text-white text-xl font-bold">G</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
              Gig Scope
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-5xl mx-auto px-6 py-16 md:py-24">
        {/* Hero Section */}
        <div className="text-center mb-20 animate-fadeInUp">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-100 text-violet-700 rounded-full text-sm font-semibold mb-6 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-600"></span>
            </span>
            Nowe oferty codziennie
          </div>
          
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Otrzymuj najlepsze
            <br />
            <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
              oferty freelance
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Subskrybuj powiadomienia i bądź na bieżąco z najlepszymi zleceniami 
            z popularnych platform freelancerskich. Zupełnie za darmo! 🚀
          </p>
        </div>

        {/* Subscription Form */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-200/50 p-8 md:p-12">
            <form onSubmit={handleSubmit} className="space-y-10">
              {/* Email Input */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">📧</span>
                  <label className="block text-base font-bold text-gray-900">
                    Twój adres email
                  </label>
                </div>
                <Input
                  type="email"
                  placeholder="twoj.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={emailError}
                  disabled={loading}
                />
              </div>

              {/* Categories Selection */}
              <div>
                <div className="flex items-center gap-2 mb-5">
                  <span className="text-2xl">🎯</span>
                  <label className="block text-base font-bold text-gray-900">
                    Wybierz interesujące Cię kategorie
                  </label>
                </div>
                
                {loadingCategories ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-violet-200 border-t-violet-600"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-6 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ) : categories.length === 0 ? (
                  <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                    <span className="text-5xl mb-3 block">📦</span>
                    <p className="text-gray-500 font-medium">Brak dostępnych kategorii</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {categories.map((category) => {
                      const isSelected = selectedCategories.includes(category);
                      return (
                        <label
                          key={category}
                          className={`group relative flex items-center p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 
                            ${isSelected 
                              ? 'border-violet-400 bg-gradient-to-br from-violet-50 to-fuchsia-50 shadow-md shadow-violet-100' 
                              : 'border-gray-200 bg-white hover:border-violet-300 hover:bg-violet-50/50'
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleCategoryToggle(category)}
                            className="w-5 h-5 text-violet-600 border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 transition-all"
                          />
                          <span className={`ml-4 text-sm font-semibold transition-colors ${isSelected ? 'text-violet-900' : 'text-gray-700'}`}>
                            {category}
                          </span>
                          {isSelected && (
                            <span className="ml-auto text-lg">✨</span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-5 bg-red-50 border-2 border-red-200 rounded-2xl shadow-sm animate-fadeInUp">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">⚠️</span>
                    <p className="text-sm text-red-900 font-medium flex-1">{error}</p>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="p-5 bg-gradient-to-r from-violet-50 to-fuchsia-50 border-2 border-violet-200 rounded-2xl shadow-sm animate-fadeInUp">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">🎉</span>
                    <p className="text-sm text-violet-900 font-medium flex-1">
                      Pomyślnie zapisano! Wkrótce otrzymasz pierwsze powiadomienia.
                    </p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={loading}
                  disabled={loading || loadingCategories}
                  className="w-full md:w-auto"
                >
                  {loading ? 'Zapisywanie...' : 'Zapisz się na powiadomienia →'}
                </Button>
              </div>
            </form>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 text-center">
            <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <span>✓</span>
                <span>Zupełnie za darmo</span>
              </div>
              <div className="flex items-center gap-2">
                <span>✓</span>
                <span>Wypisz się w każdej chwili</span>
              </div>
              <div className="flex items-center gap-2">
                <span>✓</span>
                <span>Brak spamu</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-gray-200/50 mt-32 bg-white/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-12">
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
