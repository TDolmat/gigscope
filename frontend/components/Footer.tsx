export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="relative border-t border-blue-100/30 mt-32 bg-white/50 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-extrabold bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent mb-1">
              GigScope
            </h3>
            <p className="text-xs text-gray-500">Najlepsze oferty freelance</p>
          </div>
          <p className="text-sm text-gray-600">© {currentYear} GigScope. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

