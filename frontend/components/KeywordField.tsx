'use client';

import React from 'react';
import { Check, Plus, X } from 'lucide-react';
import { TagInput } from '@/components/ui/TagInput';
import { Tooltip } from '@/components/ui/Tooltip';

export type KeywordType = 'must' | 'may' | 'not';

interface KeywordFieldProps {
  type: KeywordType;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  disabled?: boolean;
}

const KEYWORD_CONFIG = {
  must: {
    icon: Check,
    label: 'Musi zawierać',
    placeholder: 'np. React, TypeScript, Frontend',
    helperText: <>⚠️ <span className="font-semibold text-white">Każda</span> oferta musi zawierać <span className="font-semibold text-white">wszystkie</span> te słowa naraz - im więcej wpiszesz, tym <span className="font-semibold text-white">mniej</span> ofert otrzymasz</>,
    tooltip: (
      <div className="text-left">
        <p className="font-semibold mb-2 text-white">✅ Wszystkie słowa wymagane</p>
        <p className="text-xs text-white/70 mb-2">
          Zlecenie musi zawierać <strong className="text-white">KAŻDE</strong> z podanych słów kluczowych.
        </p>
        <div className="bg-white/5 rounded-lg p-2 text-xs mb-2">
          <p className="font-semibold mb-1 text-white">Przykład:</p>
          <p className="text-white/70">React, TypeScript, Frontend</p>
          <p className="text-white/50 mt-1">→ Zlecenie musi zawierać React <strong className="text-white">I</strong> TypeScript <strong className="text-white">I</strong> Frontend</p>
        </div>
        <p className="text-xs text-white/50 border-t border-white/10 pt-2">
          💡 Dla platform zagranicznych wpisuj słowa po angielsku
        </p>
      </div>
    ),
  },
  may: {
    icon: Plus,
    label: 'Może zawierać',
    labelSuffix: '(główne słowa kluczowe)',
    placeholder: 'np. Next.js, Tailwind, UI/UX',
    helperText: <>Wystarczy <span className="font-semibold text-white">jedno</span> z tych słów - im więcej wpiszesz, tym <span className="font-semibold text-white">więcej</span> ofert otrzymasz</>,
    tooltip: (
      <div className="text-left">
        <p className="font-semibold mb-2 text-white">➕ Jedno lub więcej słów</p>
        <p className="text-xs text-white/70 mb-2">
          Zlecenie zawierające <strong className="text-white">KTÓREKOLWIEK</strong> z tych słów zostanie pokazane.
        </p>
        <div className="bg-white/5 rounded-lg p-2 text-xs mb-2">
          <p className="font-semibold mb-1 text-white">Przykład:</p>
          <p className="text-white/70">Next.js, Tailwind, UI/UX</p>
          <p className="text-white/50 mt-1">→ Zlecenie z Next.js <strong className="text-white">LUB</strong> Tailwind <strong className="text-white">LUB</strong> UI/UX zostanie pokazane</p>
        </div>
        <p className="text-xs text-white/50 border-t border-white/10 pt-2">
          💡 Dla platform zagranicznych wpisuj słowa po angielsku
        </p>
      </div>
    ),
  },
  not: {
    icon: X,
    label: 'Nie może zawierać',
    placeholder: 'np. WordPress, PHP, Backend',
    helperText: <><span className="font-semibold text-white">Żadne</span> z tych słów nie może wystąpić</>,
    tooltip: (
      <div className="text-left">
        <p className="font-semibold mb-2 text-white">❌ Żadne z tych słów</p>
        <p className="text-xs text-white/70 mb-2">
          Zlecenie zawierające <strong className="text-white">KTÓREKOLWIEK</strong> z tych słów zostanie odfiltrowane.
        </p>
        <div className="bg-white/5 rounded-lg p-2 text-xs mb-2">
          <p className="font-semibold mb-1 text-white">Przykład:</p>
          <p className="text-white/70">WordPress, PHP, Backend</p>
          <p className="text-white/50 mt-1">→ Jeśli zlecenie zawiera WordPress <strong className="text-white">LUB</strong> PHP <strong className="text-white">LUB</strong> Backend, zostanie ukryte</p>
        </div>
        <p className="text-xs text-white/50 border-t border-white/10 pt-2">
          💡 Dla platform zagranicznych wpisuj słowa po angielsku
        </p>
      </div>
    ),
  },
};

export function KeywordField({ type, tags, onTagsChange, disabled = false }: KeywordFieldProps) {
  const config = KEYWORD_CONFIG[type];
  const Icon = config.icon;
  
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-3">
        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-[#F1E388]" />
        <label className="block text-sm sm:text-base font-bold text-white">
          {config.label}
        </label>
        {'labelSuffix' in config && (
          <span className="text-xs font-normal text-white/50">{config.labelSuffix}</span>
        )}
        <Tooltip content={config.tooltip} />
      </div>
      <TagInput
        placeholder={config.placeholder}
        value={tags}
        onChange={onTagsChange}
        disabled={disabled}
      />
      <p className="mt-2 text-xs sm:text-sm text-white/50">{config.helperText}</p>
    </div>
  );
}

