'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { HelpCircle, ArrowLeft } from 'lucide-react';

interface HeaderProps {
  variant?: 'home' | 'default';
  onHowItWorksClick?: () => void;
}

export function Header({ variant = 'default', onHowItWorksClick }: HeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 bg-[#2B2E33] border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo - left aligned */}
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
            <Image 
              src="/logo.png" 
              alt="AI Scoper" 
              width={120} 
              height={120}
              className="h-10 sm:h-12 w-auto"
              priority
            />
          </Link>
          
          {/* Right side actions */}
          <div className="flex items-center">
            {variant === 'home' && onHowItWorksClick && (
              <button
                onClick={onHowItWorksClick}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white/70 hover:text-[#F1E388] hover:bg-white/5 rounded-lg transition-all cursor-pointer"
              >
                <HelpCircle className="w-4 h-4" />
                <span className="hidden xs:inline">Jak to działa?</span>
                <span className="xs:hidden">Info</span>
              </button>
            )}

            {variant === 'default' && (
              <Button
                onClick={() => router.push('/')}
                variant="ghost"
                size="sm"
                className="!px-2 sm:!px-4"
              >
                <ArrowLeft className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Strona główna</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
