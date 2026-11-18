import { getTranslations } from 'next-intl/server';

const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "Top Gartengeräte";

export async function generateMetadata() {
  const t = await getTranslations('StoreLocator');
  return {
    title: `${t('page_title')} - ${storeName}`,
    description: t('page_description'),
  };
}

export default async function StoreLocatorPage() {
  const t = await getTranslations('StoreLocator');
  const stores = [
    {
      id: 1,
      name: `${storeName} – Hauptstandort Marienhafe`,
      address: 'Rosenstraße 19, 26529 Marienhafe, Deutschland',
      email: 'kontakt@topgartengeraete.de',
      hours: t('hours_1'),
      status: t('status_open'),
    },
  ];

  return (
    <div className="bg-gray-50 min-h-screen py-8 md:py-12 font-sans">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{t('title')}</h1>
          <p className="text-gray-600 text-lg">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Standortliste */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder={t('search_placeholder')}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 outline-none transition"
                />
                <svg className="w-5 h-5 text-gray-500 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
            </div>

            <div className="space-y-4 pr-2 custom-scrollbar">
              {stores.map((store) => (
                <div key={store.id} className="bg-white p-5 rounded-xl border border-gray-200 hover:border-emerald-600 hover:shadow-md transition group">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-900 group-hover:text-[#107b46] transition">{store.name}</h3>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${store.status === t('status_open') ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {store.status}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3 flex items-start">
                    <svg className="w-4 h-4 mr-2 mt-0.5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {store.address}
                  </p>
                  <div className="space-y-1.5 mb-4">
                    <p className="text-sm text-gray-500 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      <a href={`mailto:${store.email}`} className="hover:text-[#107b46] transition">{store.email}</a>
                    </p>
                    <p className="text-sm text-gray-500 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {store.hours}
                    </p>
                  </div>
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=Rosenstra%C3%9Fe+19,+26529+Marienhafe,+Deutschland"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 rounded-lg transition text-sm"
                  >
                    {t('directions')}
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Karte */}
          <div className="lg:col-span-2 bg-gray-200 rounded-xl border border-gray-300 overflow-hidden h-[400px] lg:h-[700px] relative">
            <iframe 
              src="https://maps.google.com/maps?q=Rosenstra%C3%9Fe+19,+26529+Marienhafe,+Deutschland&t=&z=15&ie=UTF8&iwloc=&output=embed" 
              className="w-full h-full border-0" 
              allowFullScreen={true} 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              title={`${storeName} Standort Marienhafe`}
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  );
}
