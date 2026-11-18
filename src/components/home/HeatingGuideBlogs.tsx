import React from 'react';
import prisma from '@/lib/prisma';
import GardenBlogCarousel, { type BlogCardItem } from './GardenBlogCarousel';

function formatGermanBlogDate(date: Date): string {
  const month = new Intl.DateTimeFormat('de-DE', { month: 'long' }).format(date);
  return `${month} ${date.getDate()}, ${date.getFullYear()}`;
}

function stripHtml(raw: string): string {
  return raw
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export default async function HeatingGuideBlogs() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let dbArticles: any[] = [];
  try {
    dbArticles = await prisma.article.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
      take: 9,
    });
  } catch (e) {
    console.error('Error fetching articles for HeatingGuideBlogs', e);
  }

  const fallbackArticles: BlogCardItem[] = [
    {
      id: 'blog-1',
      title: 'Die besten Rasentraktoren 2026 für große Flächen: Unsere Empfehlungen',
      slug: '',
      excerpt: 'Ziel: Die besten Rasentraktoren für große Gärten vorstellen. Inhalt: Vergleich von Schnittbreite, Motorleistung und Fangkorb.',
      authorName: 'Top Gartengeräte',
      dateFormatted: 'Juni 18, 2025',
    },
    {
      id: 'blog-2',
      title: 'Installation eines Rasenmähroboters: Schritt-für-Schritt-Anleitung und häufige Fehler',
      slug: '',
      excerpt: 'Ziel: Die Installation einfach erklären und typische Fehler vermeiden, damit Ihr Mähroboter ab dem ersten Tag perfekt arbeitet.',
      authorName: 'Top Gartengeräte',
      dateFormatted: 'Juni 18, 2025',
    },
    {
      id: 'blog-3',
      title: 'So pflegen Sie Ihren Rasentraktor richtig – für eine längere Lebensdauer',
      slug: '',
      excerpt: 'Ziel: Praktische Tipps zur Pflege und Wartung eines Rasentraktors – von der Messerpflege bis zur richtigen Einwinterung.',
      authorName: 'Top Gartengeräte',
      dateFormatted: 'Juni 18, 2025',
    },
  ];

  const items: BlogCardItem[] =
    dbArticles.length > 0
      ? dbArticles.map((art) => {
          const cleanExcerpt = art.excerpt
            ? stripHtml(art.excerpt)
            : art.content
              ? stripHtml(art.content).slice(0, 140) + '...'
              : '';
          return {
            id: art.id,
            title: art.title,
            slug: art.slug,
            excerpt: cleanExcerpt,
            authorName: art.authorName || 'Top Gartengeräte',
            dateFormatted: formatGermanBlogDate(new Date(art.createdAt)),
          };
        })
      : fallbackArticles;

  return <GardenBlogCarousel articles={items} title="Unser Blog" />;
}
