'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export interface BlogCardItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  authorName: string;
  dateFormatted: string;
}

interface GardenBlogCarouselProps {
  articles: BlogCardItem[];
  title?: string;
}

export default function GardenBlogCarousel({
  articles,
  title = 'Unser Blog',
}: GardenBlogCarouselProps) {
  const [pageIndex, setPageIndex] = useState(0);
  const itemsPerPage = 3;
  const totalPages = Math.max(1, Math.ceil(articles.length / itemsPerPage));
  const safePageIndex = pageIndex % totalPages;
  const visibleArticles = articles.slice(
    safePageIndex * itemsPerPage,
    safePageIndex * itemsPerPage + itemsPerPage
  );

  const handlePrev = () => {
    setPageIndex((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const handleNext = () => {
    setPageIndex((prev) => (prev + 1) % totalPages);
  };

  return (
    <section id="ratgeber" className="bg-white pb-6 pt-1 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-start gap-6">
          {/* Left 254px alignment spacer (matches Header/Hero/Showcase layout) */}
          <div className="hidden lg:block w-[254px] shrink-0" aria-hidden="true" />

          {/* Right "Unser Blog" Container */}
          <div className="flex-1 min-w-0 w-full bg-[#f9f9fa] border border-stone-200/85 rounded-[6px] p-5 shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
            {/* Header Bar */}
            <div className="flex items-center justify-between gap-4 mb-5">
              <h2 className="text-[18px] font-semibold text-stone-800 tracking-tight pl-3 border-l-[3px] border-[#00a86b] leading-none py-0.5">
                {title}
              </h2>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Vorherige Blogbeiträge"
                  className="w-8 h-8 rounded-full bg-[#4ec198] hover:bg-[#00a86b] text-white flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.3} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Nächste Blogbeiträge"
                  className="w-8 h-8 rounded-full bg-[#4ec198] hover:bg-[#00a86b] text-white flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.3} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 3-Column Blog Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {visibleArticles.map((art) => {
                const href = art.slug ? `/blog/${art.slug}` : '/blog';
                return (
                  <Link
                    key={art.id}
                    href={href}
                    className="bg-white border border-stone-200/85 hover:border-[#00a86b]/50 shadow-[0_1px_2px_rgba(15,23,42,0.03)] hover:shadow-[0_10px_24px_-12px_rgba(15,23,42,0.14)] hover:-translate-y-0.5 rounded-[5px] p-5 transition-all duration-200 group flex flex-col"
                  >
                    <div className="text-[12px] font-medium text-[#e05246] leading-snug">
                      <div>{art.dateFormatted} •</div>
                      <div className="text-stone-400 font-normal">von {art.authorName}</div>
                    </div>

                    <h3 className="mt-2.5 text-[14px] font-semibold text-stone-800 group-hover:text-[#00a86b] leading-snug line-clamp-3 transition-colors">
                      {art.title}
                    </h3>

                    <p className="mt-2 text-[12.5px] text-stone-500 leading-relaxed line-clamp-3">
                      {art.excerpt}
                    </p>

                    <span className="mt-auto pt-3.5 inline-flex items-center gap-1 text-[12px] font-semibold text-[#00a86b]">
                      <span>Weiterlesen</span>
                      <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
