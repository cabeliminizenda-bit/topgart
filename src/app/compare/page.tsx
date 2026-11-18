import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Produkte vergleichen | Top Gartengeräte',
  description: 'Produkte bei Top Gartengeräte vergleichen',
  robots: { index: false, follow: false },
};

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center max-w-lg w-full">
        <div className="text-6xl mb-4">⚖️</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Produkte vergleichen</h1>
        <p className="text-gray-600 mb-8">
          Die Produktvergleichsfunktion ist bald verfügbar. Bitte schauen Sie später wieder vorbei.
        </p>
        <Link 
          href="/shop" 
          className="inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#107b46] hover:bg-[#0d693b] transition"
        >
          Zurück zum Shop
        </Link>
      </div>
    </div>
  );
}
