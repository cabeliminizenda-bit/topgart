'use client';

import Script from 'next/script';
import { useSyncExternalStore } from 'react';

function subscribe(callback: () => void) {
  window.addEventListener('cookie_consent_accepted', callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener('cookie_consent_accepted', callback);
    window.removeEventListener('storage', callback);
  };
}

function getSnapshot() {
  return localStorage.getItem('cookie_consent') === 'true';
}

function getServerSnapshot() {
  return false;
}

export default function GoogleAnalytics({ gaId }: { gaId?: string }) {
  const consentGiven = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const cleanGaId = gaId?.trim().match(/\b(G-[A-Z0-9]+|UA-[0-9]+-[0-9]+|GT-[A-Z0-9]+)\b/i)?.[1]?.toUpperCase() || gaId?.trim();

  if (!cleanGaId || !consentGiven) {
    return null;
  }

  return (
    <>
      <Script
        strategy="lazyOnload"
        src={`https://www.googletagmanager.com/gtag/js?id=${cleanGaId}`}
      />
      <Script
        id="google-analytics"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${cleanGaId}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  );
}
