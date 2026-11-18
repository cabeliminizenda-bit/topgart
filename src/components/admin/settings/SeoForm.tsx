'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateSettingsBatch } from '@/actions/settings';
import MediaPickerModal from '@/components/admin/MediaPickerModal';
import { useTranslations } from 'next-intl';
import Image from "next/image";

function cleanVerificationToken(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  const match = trimmed.match(/content=["']([^"']+)["']/i) || trimmed.match(/google-site-verification=([^"'\s&]+)/i);
  if (match) return match[1].trim();
  return trimmed.replace(/^["']|["']$/g, '').trim();
}

function cleanAnalyticsId(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  const match = trimmed.match(/\b(G-[A-Z0-9]+|UA-[0-9]+-[0-9]+|GT-[A-Z0-9]+)\b/i);
  if (match) return match[1].toUpperCase();
  return trimmed;
}

export default function SeoForm({ initialSettings }: { initialSettings: Record<string, string> }) {
  const router = useRouter();
  const tSeo = useTranslations('AdminSEO');
  
  const [metaTitle, setMetaTitle] = useState(initialSettings.HOME_META_TITLE || '');
  const [metaDescription, setMetaDescription] = useState(initialSettings.HOME_META_DESCRIPTION || '');
  const [ogImage, setOgImage] = useState(initialSettings.OG_IMAGE || '');
  const [googleSiteVerification, setGoogleSiteVerification] = useState(initialSettings.GOOGLE_SITE_VERIFICATION || '');
  const [bingSiteVerification, setBingSiteVerification] = useState(initialSettings.BING_SITE_VERIFICATION || '');
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState(initialSettings.GOOGLE_ANALYTICS_ID || '');
  
  const [storeCountry, setStoreCountry] = useState(initialSettings.STORE_COUNTRY || 'DE');
  const [rssBeforeContent, setRssBeforeContent] = useState(initialSettings.RSS_BEFORE_CONTENT || '');
  const [rssAfterContent, setRssAfterContent] = useState(initialSettings.RSS_AFTER_CONTENT || 'Der Artikel {post_link} erschien zuerst auf {blog_link}.');

  const [showMediaModal, setShowMediaModal] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    
    const settingsMap: Record<string, string> = {
      HOME_META_TITLE: metaTitle,
      HOME_META_DESCRIPTION: metaDescription,
      OG_IMAGE: ogImage,
      GOOGLE_SITE_VERIFICATION: cleanVerificationToken(googleSiteVerification),
      BING_SITE_VERIFICATION: cleanVerificationToken(bingSiteVerification),
      GOOGLE_ANALYTICS_ID: cleanAnalyticsId(googleAnalyticsId),
      STORE_COUNTRY: storeCountry,
      RSS_BEFORE_CONTENT: rssBeforeContent,
      RSS_AFTER_CONTENT: rssAfterContent,
    };

    await updateSettingsBatch(settingsMap);

    setMessage('SEO-Einstellungen erfolgreich aktualisiert');
    setIsLoading(false);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{tSeo('seo_section_title') || 'SEO & OpenGraph'}</h2>
        <p className="text-gray-500 mt-1">{tSeo('home_seo_desc') || 'Globale SEO-Einstellungen (für die Startseite und als Standardwert).'}</p>
      </div>

      {message && (
        <div className="bg-green-50 text-green-700 p-4 rounded-md border border-green-200">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 pb-6">
          <div className="mb-4 md:mb-0 md:w-1/3">
            <label className="block text-sm font-medium text-gray-700">{tSeo('home_meta_title_label') || 'Meta-Titel (Startseite)'}</label>
            <p className="text-xs text-gray-500 mt-1">{tSeo('home_meta_title_help') || 'Empfohlen werden 50 bis 60 Zeichen.'}</p>
          </div>
          <div className="md:w-2/3">
            <input
              type="text"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder="Top Gartengeräte | Hochwertige Gartentechnik"
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <div className={`text-xs mt-1 ${metaTitle.length < 50 ? 'text-red-500' : metaTitle.length > 60 ? 'text-orange-600' : 'text-green-600'}`}>
              {metaTitle.length} {tSeo('chars') || 'Zeichen'} {metaTitle.length > 0 && (metaTitle.length < 50 ? tSeo('too_short') : metaTitle.length > 60 ? tSeo('too_long') : tSeo('perfect'))}
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-start justify-between border-b border-gray-100 pb-6">
          <div className="mb-4 md:mb-0 md:w-1/3">
            <label className="block text-sm font-medium text-gray-700">{tSeo('home_meta_desc_label') || 'Meta-Beschreibung'}</label>
            <p className="text-xs text-gray-500 mt-1">{tSeo('home_meta_desc_help') || 'Empfohlen werden 80 bis 125 Zeichen für eine optimale Klickrate (CTR).'}</p>
          </div>
          <div className="md:w-2/3">
            <textarea
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              rows={3}
              placeholder="Entdecken Sie unseren Online-Shop..."
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <div className={`text-xs mt-1 ${metaDescription.length < 80 ? 'text-red-500' : metaDescription.length > 125 ? 'text-orange-600' : 'text-green-600'}`}>
              {metaDescription.length} {tSeo('chars') || 'Zeichen'} {metaDescription.length > 0 && (metaDescription.length < 80 ? tSeo('too_short') : metaDescription.length > 125 ? tSeo('too_long') : tSeo('perfect'))}
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-start justify-between border-b border-gray-100 pb-6">
          <div className="mb-4 md:mb-0 md:w-1/3">
            <label className="block text-sm font-medium text-gray-700">{tSeo('gsc_label') || 'Google Search Console'}</label>
            <p className="text-xs text-gray-500 mt-1">{tSeo('gsc_help') || 'Bestätigungscode oder vollständiges HTML-Meta-Tag aus der Search Console.'}</p>
          </div>
          <div className="md:w-2/3">
            <input
              type="text"
              value={googleSiteVerification}
              onChange={(e) => {
                const val = e.target.value;
                if (val.includes('<') || val.includes('content=') || val.includes('google-site-verification')) {
                  setGoogleSiteVerification(cleanVerificationToken(val));
                } else {
                  setGoogleSiteVerification(val);
                }
              }}
              onBlur={() => setGoogleSiteVerification(cleanVerificationToken(googleSiteVerification))}
              placeholder="z. B. abcdef12345 oder <meta name='google-site-verification' content='...' />"
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">Fügen Sie Ihren Code oder das vollständige HTML-Tag ein — der Code wird automatisch extrahiert.</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-start justify-between border-b border-gray-100 pb-6">
          <div className="mb-4 md:mb-0 md:w-1/3">
            <label className="block text-sm font-medium text-gray-700">Bing Webmaster Tools</label>
            <p className="text-xs text-gray-500 mt-1">Bestätigungscode für Bing / Yahoo / DuckDuckGo (<code>msvalidate.01</code>-Tag oder reiner Code).</p>
          </div>
          <div className="md:w-2/3">
            <input
              type="text"
              value={bingSiteVerification}
              onChange={(e) => {
                const val = e.target.value;
                if (val.includes('<') || val.includes('content=') || val.includes('msvalidate')) {
                  setBingSiteVerification(cleanVerificationToken(val));
                } else {
                  setBingSiteVerification(val);
                }
              }}
              onBlur={() => setBingSiteVerification(cleanVerificationToken(bingSiteVerification))}
              placeholder="z. B. 1234567890ABCDEF..."
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-start justify-between border-b border-gray-100 pb-6">
          <div className="mb-4 md:mb-0 md:w-1/3">
            <label className="block text-sm font-medium text-gray-700">{tSeo('ga_label') || 'Google Analytics (G-XXXXX)'}</label>
            <p className="text-xs text-gray-500 mt-1">{tSeo('ga_help') || 'GA4-Mess-ID. Das Skript wird automatisch nach Cookie-Zustimmung aktiviert.'}</p>
          </div>
          <div className="md:w-2/3">
            <input
              type="text"
              value={googleAnalyticsId}
              onChange={(e) => {
                const val = e.target.value;
                if (val.includes('<') || val.includes('gtag') || val.includes('googletagmanager')) {
                  setGoogleAnalyticsId(cleanAnalyticsId(val));
                } else {
                  setGoogleAnalyticsId(val);
                }
              }}
              onBlur={() => setGoogleAnalyticsId(cleanAnalyticsId(googleAnalyticsId))}
              placeholder="G-XXXXXXXXXX"
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono"
            />
            <p className="text-xs text-gray-400 mt-1">Fügen Sie Ihre ID (G-XXXXXXXXXX) oder das vollständige Snippet ein — die ID wird automatisch extrahiert.</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-start justify-between pb-2">
          <div className="mb-4 md:mb-0 md:w-1/3">
            <label className="block text-sm font-medium text-gray-700">{tSeo('og_image_label') || 'OpenGraph-Bild (og:image)'}</label>
            <p className="text-xs text-gray-500 mt-1">{tSeo('og_image_help') || 'Bild beim Teilen in sozialen Netzwerken (empfohlenes Format: 1200×630 Pixel).'}</p>
          </div>
          <div className="md:w-2/3">
            {ogImage && (
              <div className="mb-3">
                <Image width={800} height={800} src={ogImage} alt="OG Image" className="max-w-xs rounded-md border border-gray-200 shadow-sm" />
              </div>
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowMediaModal(true)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {ogImage ? (tSeo('change_image') || 'Bild ändern') : (tSeo('choose_image') || 'Bild auswählen')}
              </button>
              {ogImage && (
                <button
                  type="button"
                  onClick={() => setOgImage('')}
                  className="px-3 py-2 bg-white border border-red-200 text-red-600 rounded-md text-sm font-medium hover:bg-red-50 focus:outline-none"
                >
                  Entfernen
                </button>
              )}
            </div>
            
            {showMediaModal && (
              <MediaPickerModal 
                onClose={() => setShowMediaModal(false)}
                onSelect={(url) => {
                  setOgImage(url);
                  setShowMediaModal(false);
                }}
              />
            )}
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">{tSeo('local_seo_title') || 'Lokales SEO & Strukturierte Daten'}</h3>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-6">
            <div className="mb-4 md:mb-0 md:w-1/3">
              <label className="block text-sm font-medium text-gray-700">{tSeo('store_country_label') || 'Land des Shops (ISO-Code)'}</label>
              <p className="text-xs text-gray-500 mt-1">{tSeo('store_country_help') || 'z. B. DE, AT, CH. Wird für strukturierte Daten verwendet.'}</p>
            </div>
            <div className="md:w-2/3">
              <input
                type="text"
                value={storeCountry}
                onChange={(e) => setStoreCountry(e.target.value.toUpperCase())}
                placeholder="DE"
                maxLength={2}
                className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 pt-8 border-t border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">{tSeo('rss_protection_title') || 'RSS-Feed & Inhaltsschutz'}</h3>
          <p className="text-sm text-gray-500 mb-6" dangerouslySetInnerHTML={{ __html: tSeo.raw ? tSeo.raw('rss_protection_desc') : tSeo('rss_protection_desc') || "Fügen Sie benutzerdefinierten Inhalt vor oder nach jedem Artikel in Ihrem RSS-Feed hinzu. Verwenden Sie die Variablen <code>{post_link}</code>, <code>{blog_link}</code>, <code>{author}</code> und <code>{featuredimage}</code>." }}></p>
          
          <div className="flex flex-col md:flex-row md:items-start justify-between border-b border-gray-100 pb-6 mb-6">
            <div className="mb-4 md:mb-0 md:w-1/3">
              <label className="block text-sm font-medium text-gray-700">{tSeo('rss_before_label') || 'Inhalt vor dem Artikel (RSS)'}</label>
            </div>
            <div className="md:w-2/3">
              <textarea
                value={rssBeforeContent}
                onChange={(e) => setRssBeforeContent(e.target.value)}
                rows={2}
                placeholder={tSeo('rss_before_placeholder') || "z. B. Willkommen auf unserem Ratgeber-Blog..."}
                className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-start justify-between pb-2">
            <div className="mb-4 md:mb-0 md:w-1/3">
              <label className="block text-sm font-medium text-gray-700">{tSeo('rss_after_label') || 'Inhalt nach dem Artikel (RSS)'}</label>
              <p className="text-xs text-gray-500 mt-1">{tSeo('rss_after_help') || 'Empfohlen für die SEO-Quellenangabe.'}</p>
            </div>
            <div className="md:w-2/3">
              <textarea
                value={rssAfterContent}
                onChange={(e) => setRssAfterContent(e.target.value)}
                rows={3}
                placeholder={tSeo('rss_after_placeholder') || "Der Artikel {post_link} erschien zuerst auf {blog_link}."}
                className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:bg-gray-400 text-sm font-semibold transition-colors"
        >
          {isLoading ? tSeo('saving') : tSeo('save_btn')}
        </button>
      </div>
    </form>
  );
}
