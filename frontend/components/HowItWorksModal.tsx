'use client';

import { Button } from '@/components/ui/Button';
import { Check, Plus, X } from 'lucide-react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HowItWorksModal({ isOpen, onClose }: HowItWorksModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 sm:p-8 md:p-12">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Jak to działa?</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer p-1"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          <div className="space-y-6 sm:space-y-8">
            {/* Steps */}
            <Step 
              number={1} 
              title="Ustaw swoje preferencje"
              description={<>
                Wpisz email i określ słowa kluczowe, które <strong>muszą</strong> być w zleceniu, 
                które <strong>mogą</strong> być (preferowane), oraz które <strong>nie mogą</strong> się pojawić.
              </>}
            />

            <Step 
              number={2} 
              title="Otrzymuj codzienne powiadomienia"
              description={<>
                Każdego dnia o ustalonej porze dostaniesz maila z <strong>najlepszymi ofertami</strong>, 
                które spełniają Twoje kryteria i pojawiły się tego dnia.
              </>}
            />

            <Step 
              number={3} 
              title="Zarządzaj subskrypcją"
              description={<>
                W każdym mailu znajdziesz opcję <strong>zmiany preferencji</strong> słów kluczowych 
                lub <strong>wypisania się</strong> z powiadomień.
              </>}
            />

            {/* Keyword Logic Explanation */}
            <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200">
              <h4 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 sm:mb-6 flex items-center gap-2">
                <span className="text-xl sm:text-2xl">🎯</span>
                Jak działają słowa kluczowe?
              </h4>
              
              <div className="space-y-4 sm:space-y-5">
                <KeywordExplanation 
                  type="must"
                  title="Musi zawierać (I / AND)"
                  description={<>Zlecenie musi zawierać <strong>WSZYSTKIE</strong> podane słowa kluczowe.</>}
                  example="React, TypeScript, Frontend"
                  examples={[
                    { text: 'Zlecenie: "Szukamy developera React + TypeScript do projektu frontend"', isValid: true },
                    { text: 'Zlecenie: "Szukamy developera React do projektu frontend" (brak TypeScript)', isValid: false },
                  ]}
                />

                <KeywordExplanation 
                  type="may"
                  title="Może zawierać (LUB / OR)"
                  description={<>Zlecenie zawierające <strong>JEDNO LUB WIĘCEJ</strong> z tych słów zostanie pokazane.</>}
                  example="Next.js, Tailwind, UI/UX"
                  examples={[
                    { text: 'Zlecenie z Next.js zostanie pokazane', isValid: true },
                    { text: 'Zlecenie z Tailwind zostanie pokazane', isValid: true },
                    { text: 'Zlecenie z Next.js + Tailwind również zostanie pokazane', isValid: true },
                  ]}
                />

                <KeywordExplanation 
                  type="not"
                  title="Nie może zawierać (NIE / NOT)"
                  description={<>Zlecenia z <strong>KTÓRYMKOLWIEK</strong> z tych słów zostaną całkowicie odfiltrowane.</>}
                  example="WordPress, PHP, Backend"
                  examples={[
                    { text: 'Zlecenie z WordPress zostanie ukryte', isValid: false },
                    { text: 'Zlecenie z PHP zostanie ukryte', isValid: false },
                    { text: 'Zlecenie zawierające Backend również nie pojawi się w wynikach', isValid: false },
                  ]}
                />
              </div>
            </div>

            {/* Tips */}
            <div className="space-y-3 sm:space-y-4">
              <div className="p-4 sm:p-6 bg-blue-50 rounded-xl sm:rounded-2xl border border-blue-200">
                <p className="text-xs sm:text-sm text-slate-700 font-medium mb-1.5 sm:mb-2">
                  <strong>💡 Wskazówka:</strong> Im precyzyjniejsze słowa kluczowe, tym lepiej dopasowane oferty!
                </p>
                <p className="text-xs text-gray-600 mt-2">
                  Pamiętaj: dla platform międzynarodowych (Upwork, Fiverr) używaj słów po angielsku, dla polskich platform (Useme) po polsku.
                </p>
              </div>

              <div className="p-4 sm:p-6 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl sm:rounded-2xl border border-blue-200">
                <p className="text-xs sm:text-sm text-slate-700 font-medium mb-1.5 sm:mb-2">
                  <strong>🔒 Dla członków be free club</strong>
                </p>
                <p className="text-xs sm:text-sm text-gray-600">
                  Ta usługa jest dostępna tylko dla członków społeczności.{' '}
                  <a 
                    href="https://circle.befree.club" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 font-semibold hover:text-blue-700 underline"
                  >
                    Dołącz do be free club →
                  </a>
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 sm:mt-8 flex justify-center">
            <Button
              onClick={onClose}
              variant="primary"
              size="lg"
              className="w-full sm:w-auto"
            >
              Rozumiem, zaczynam!
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-components

interface StepProps {
  number: number;
  title: string;
  description: React.ReactNode;
}

function Step({ number, title, description }: StepProps) {
  return (
    <div className="flex gap-3 sm:gap-4">
      <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg text-sm sm:text-base">
        {number}
      </div>
      <div>
        <h4 className="text-base sm:text-lg font-bold text-slate-900 mb-1.5 sm:mb-2">{title}</h4>
        <p className="text-sm sm:text-base text-gray-600">{description}</p>
      </div>
    </div>
  );
}

interface KeywordExplanationProps {
  type: 'must' | 'may' | 'not';
  title: string;
  description: React.ReactNode;
  example: string;
  examples: { text: string; isValid: boolean }[];
}

function KeywordExplanation({ type, title, description, example, examples }: KeywordExplanationProps) {
  const styles = {
    must: { bg: 'bg-green-50', border: 'border-green-500', icon: Check, iconColor: 'text-green-600' },
    may: { bg: 'bg-blue-50', border: 'border-blue-500', icon: Plus, iconColor: 'text-blue-600' },
    not: { bg: 'bg-red-50', border: 'border-red-500', icon: X, iconColor: 'text-red-600' },
  };

  const style = styles[type];
  const Icon = style.icon;

  return (
    <div className={`${style.bg} border-l-4 ${style.border} p-4 sm:p-5 rounded-r-xl`}>
      <div className="flex items-start gap-2 sm:gap-3">
        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${style.iconColor} flex-shrink-0 mt-0.5`} />
        <div>
          <h5 className="font-bold text-slate-900 mb-1.5 sm:mb-2 text-sm sm:text-base">{title}</h5>
          <p className="text-xs sm:text-sm text-gray-700 mb-2 sm:mb-3">{description}</p>
          <div className="bg-white/70 rounded-lg p-2 sm:p-3 text-xs sm:text-sm">
            <p className="font-semibold text-slate-900 mb-1">Przykład:</p>
            <p className="text-gray-700 mb-2">
              <code className="bg-gray-100 px-1.5 sm:px-2 py-0.5 rounded text-xs">{example}</code>
            </p>
            {examples.map((ex, idx) => (
              <p key={idx} className="text-gray-600 text-xs sm:text-sm">
                {ex.isValid ? '✅' : '❌'} {ex.text}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

