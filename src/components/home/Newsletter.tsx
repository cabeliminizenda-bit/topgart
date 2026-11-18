/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { submitNewsletter } from '@/actions/contact';

export default function Newsletter({ config }: { config?: any }) {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const heading = config?.heading || 'Newsletter abonnieren';
  const description =
    config?.description ||
    'Abonnieren Sie unsere Mailingliste und erhalten Sie 22€ Rabatt.';
  const placeholder = config?.placeholder || 'Ihre E-Mail-Adresse';
  const buttonText = config?.buttonText || 'Anmelden';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    const formData = new FormData(e.currentTarget);
    const res = await submitNewsletter(formData);

    if (res.error) {
      setStatus('error');
      setMessage(res.error);
    } else if (res.success) {
      setStatus('success');
      setMessage(res.message || 'Vielen Dank für Ihre Anmeldung!');
      e.currentTarget.reset();
      router.push('/thank-you');
    }
  };

  return (
    <section className="w-full bg-white pt-2 pb-10 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#f4f5f6] border border-stone-200/80 rounded-[5px] px-5 sm:px-7 py-4 flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-6">
          {/* Left: Flying Envelope Icon + Title */}
          <div className="flex items-center gap-3 shrink-0">
            <svg
              className="w-8 h-8 text-stone-800 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 28 24"
              aria-hidden="true"
            >
              {/* Motion lines */}
              <path strokeLinecap="round" strokeWidth={1.6} d="M1.5 8.5h4M1 12h4.5M2.5 15.5h3" />
              {/* Envelope */}
              <rect x="7.5" y="4.5" width="18" height="14" rx="1.8" strokeWidth={1.6} />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M8.5 6l8 6 8-6" />
            </svg>
            <h2 className="text-[16px] sm:text-[17px] font-medium text-stone-800 whitespace-nowrap">
              {heading}
            </h2>
          </div>

          {/* Vertical Divider */}
          <div className="hidden lg:block w-px h-7 bg-stone-300/80 shrink-0" aria-hidden="true" />

          {/* Center: Subtitle */}
          <p className="text-[13px] text-stone-700 flex-1 text-center lg:text-left leading-snug">
            {description}
          </p>

          {/* Right: Email Input + Green Button */}
          <div className="w-full lg:w-auto shrink-0">
            {status === 'success' ? (
              <div className="bg-emerald-50 text-[#00a86b] text-xs font-semibold px-4 py-2.5 rounded-[4px] border border-emerald-200">
                {message}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-1.5">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <input
                    type="email"
                    name="email"
                    placeholder={placeholder}
                    className="bg-white border border-stone-200/90 rounded-[4px] px-4 h-[42px] w-full sm:w-[270px] text-[13px] text-stone-700 placeholder:text-stone-400 outline-none focus:border-[#00a86b] focus:ring-1 focus:ring-[#00a86b]/25 transition"
                    required
                  />
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="bg-[#00a86b] hover:bg-[#008f5a] active:bg-[#007a4d] text-white font-semibold text-[13px] px-6 h-[42px] rounded-[4px] transition-colors shadow-2xs disabled:opacity-50 whitespace-nowrap cursor-pointer"
                  >
                    {status === 'loading' ? '...' : buttonText}
                  </button>
                </div>
                {status === 'error' && (
                  <p className="text-red-600 text-xs">{message}</p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
