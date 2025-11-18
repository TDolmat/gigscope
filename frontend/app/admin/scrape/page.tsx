'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function ScrapePage() {
  const [testMustContain, setTestMustContain] = useState('');
  const [testMayContain, setTestMayContain] = useState('');
  const [testMustNotContain, setTestMustNotContain] = useState('');
  const [testResults, setTestResults] = useState<any[]>([]);
  const [testing, setTesting] = useState(false);

  const handleRunTest = () => {
    setTesting(true);
    // Symulacja testu
    setTimeout(() => {
      setTestResults([
        { id: 1, title: 'Senior React Developer', platform: 'Upwork', url: '#' },
        { id: 2, title: 'Frontend Engineer - React/TypeScript', platform: 'JustJoinIT', url: '#' },
      ]);
      setTesting(false);
    }, 2000);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Scrape Test</h2>
      
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">Musi zawierać</label>
          <Input
            placeholder="np. React, TypeScript"
            value={testMustContain}
            onChange={(e) => setTestMustContain(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">Może zawierać</label>
          <Input
            placeholder="np. Next.js, Tailwind"
            value={testMayContain}
            onChange={(e) => setTestMayContain(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">Nie może zawierać</label>
          <Input
            placeholder="np. WordPress, PHP"
            value={testMustNotContain}
            onChange={(e) => setTestMustNotContain(e.target.value)}
          />
        </div>

        <Button onClick={handleRunTest} loading={testing} variant="primary" size="lg">
          {testing ? 'Testowanie...' : 'Testuj'}
        </Button>
      </div>

      {testResults.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Wyniki ({testResults.length})</h3>
          <div className="space-y-3">
            {testResults.map((result) => (
              <div key={result.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="font-semibold text-gray-900">{result.title}</div>
                <div className="text-sm text-gray-600 mt-1">
                  Platforma: {result.platform}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

