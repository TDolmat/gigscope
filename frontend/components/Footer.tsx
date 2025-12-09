import Image from 'next/image';
import { EXTERNAL_LINKS } from '@/lib/config';

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="relative border-t border-white/10 mt-16 sm:mt-32 bg-[#2B2E33]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between sm:gap-4">
          <div className="flex flex-col items-center sm:items-start gap-1">
            <h3 className="text-lg font-[family-name:var(--font-permanent-marker)] text-[#F1E388]">
              AI Scoper
            </h3>
            <p className="text-xs text-white/50 flex items-center gap-1.5">
              by
              <a href={EXTERNAL_LINKS.BE_FREE_CLUB} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                <Image src="/befreeclub-text.png" alt="Be Free Club" width={80} height={16} className="h-4 w-auto inline-block" />
              </a>
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <p className="text-xs sm:text-sm text-white/50">Copyright © {currentYear} Be Free Club</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
