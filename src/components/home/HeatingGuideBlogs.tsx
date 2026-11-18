import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import prisma from '@/lib/prisma';

export default async function HeatingGuideBlogs() {
  let articles: any[] = [];
  try {
    articles = await prisma.article.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
      take: 3
    });
  } catch (e) {
    console.error('Error fetching articles for HeatingGuideBlogs', e);
  }

  const fallbackArticles = [
    {
      id: 'a1',
      title: 'Rasenmäher kaufen: Darauf sollten Sie 2026 achten',
      slug: 'rasenmaeher-kaufen-ratgeber',
      category: 'Kaufberater',
      excerpt: 'Akku, Elektro oder Benzin? Schnittbreite, Fangkorbvolumen und Mulchfunktion – unser Guide für den perfekten Rasenmäher.',
      image: '/images/hero-appliances.jpg',
      icon: '🌿'
    },
    {
      id: 'a2',
      title: 'Mähroboter ohne Begrenzungskabel: Der große Vergleich',
      slug: 'maehroboter-vergleich',
      category: 'Rasenpflege-Guide',
      excerpt: 'GPS-Navigation, Steigungsleistung und Regensensoren: Erfahren Sie, welcher Mähroboter optimal zu Ihrer Gartenfläche passt.',
      image: '/images/hero-coffee-machine.jpg',
      icon: '🤖'
    },
    {
      id: 'a3',
      title: 'Gartengeräte richtig warten & überwintern: Profi-Tipps',
      slug: 'gartengeraete-warten-ueberwintern',
      category: 'Pflegetipps',
      excerpt: 'Mit der richtigen Messerpflege, Akku-Lagerung und Reinigung verlängern Sie die Lebensdauer Ihrer Gartengeräte um viele Jahre.',
      image: '/images/hero-appliances.jpg',
      icon: '🛠️'
    }
  ];

  const items = articles.length > 0 ? articles : fallbackArticles;

  return (
    <section id="ratgeber" className="py-14 bg-stone-50 border-t border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="flex items-end justify-between gap-3 mb-6 sm:mb-8">
          <div className="min-w-0">
            <span className="text-[#107b46] font-bold text-xs uppercase tracking-wider block">
              Top Gartengeräte Magazin &amp; Ratgeber
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-stone-900 tracking-tight leading-tight">
              Tipps &amp; Kaufberatung für Ihren Garten
            </h2>
          </div>
          <Link 
            href="/blog" 
            className="text-xs sm:text-sm font-bold text-[#107b46] hover:text-[#0d693b] flex items-center gap-1 shrink-0 transition-colors group pb-0.5"
          >
            <span>Alle Ratgeber</span>
            <span className="group-hover:translate-x-0.5 transition-transform">&rarr;</span>
          </Link>
        </div>

        {/* 3 Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((art: any) => (
            <article 
              key={art.id} 
              className="bg-white rounded-2xl border border-stone-200/90 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="h-44 bg-stone-100 flex items-center justify-center overflow-hidden relative">
                  {art.image ? (
                    <Image 
                      src={art.image} 
                      alt={art.title} 
                      width={600} 
                      height={400} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  ) : (
                    <span className="text-5xl select-none">{art.icon || '📖'}</span>
                  )}
                  <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-stone-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-xs">
                    {art.category || 'Ratgeber'}
                  </span>
                </div>
                
                <div className="p-5">
                  <Link href={`/blog/${art.slug}`}>
                    <h3 className="font-bold text-stone-900 text-base leading-snug group-hover:text-[#107b46] transition-colors line-clamp-2">
                      {art.title}
                    </h3>
                  </Link>
                  <p className="text-xs text-stone-500 mt-2 line-clamp-3 leading-relaxed">
                    {art.excerpt}
                  </p>
                </div>
              </div>

              <div className="px-5 pb-5 pt-0">
                <Link 
                  href={`/blog/${art.slug}`} 
                  className="inline-flex items-center text-xs font-bold text-[#107b46] hover:text-[#0d693b] transition-colors gap-1"
                >
                  <span>Artikel lesen</span>
                  <span>&rarr;</span>
                </Link>
              </div>
            </article>
          ))}
        </div>

      </div>
    </section>
  );
}
