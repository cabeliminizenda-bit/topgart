import Link from 'next/link';
import { getCachedSettings } from '@/lib/cache';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Seite nicht gefunden (404) | Top Gartengeräte',
  description: 'Die von Ihnen gesuchte Seite existiert leider nicht oder wurde verschoben.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function NotFound() {
  const settings = await getCachedSettings();

  let title = settings.NOT_FOUND_TITLE || "Seite nicht gefunden (404)";
  if (/p[aá]gina|n[aã]o|encontrad|oops/i.test(title)) {
    title = "Seite nicht gefunden (404)";
  }

  let text = settings.NOT_FOUND_TEXT || "Die von Ihnen gesuchte Seite existiert leider nicht oder wurde verschoben.";
  if (/não|encontrad|moved or deleted|introuvable/i.test(text)) {
    text = "Die von Ihnen gesuchte Seite existiert leider nicht oder wurde verschoben.";
  }

  let cta = settings.NOT_FOUND_CTA || "Zurück zur Startseite";
  if (/voltar|in[ií]cio|back to home|retour/i.test(cta)) {
    cta = "Zurück zur Startseite";
  }

  const bgImage = settings.NOT_FOUND_BG_IMAGE || '';
  const bgColor = settings.NOT_FOUND_BG_COLOR || '#000000';

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main
        className="flex-grow flex items-center justify-center bg-cover bg-center relative"
        style={{
          backgroundImage: bgImage ? `url('${bgImage}')` : 'none',
          backgroundColor: bgImage ? 'transparent' : bgColor
        }}
      >
        {bgImage && <div className="absolute inset-0 bg-black/50 z-0"></div>}

        <div className="relative z-10 text-center px-4 max-w-2xl mx-auto">
          <h1 className="text-9xl font-bold text-white mb-4 drop-shadow-lg">404</h1>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 drop-shadow-md">
            {title}
          </h2>
          <p className="text-lg text-gray-200 mb-8 max-w-lg mx-auto drop-shadow">
            {text}
          </p>

          <Link
            href="/"
            className="inline-block bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 px-8 rounded-full transition-transform transform hover:scale-105 shadow-lg"
          >
            {cta}
          </Link>
        </div>
      </main>
    </div>
  );
}
