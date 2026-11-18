'use client';

import { useState } from 'react';
import { submitReview } from '@/actions/reviews';
import { useTranslations, useLocale } from 'next-intl';
import SafeHTML from '@/components/SafeHTML';

type Review = {
  id: string;
  rating: number;
  comment: string;
  createdAt: Date | string;
  reviewerName?: string | null;
};

type ProductReviewsProps = {
  productId: string;
  productTitle?: string;
  reviews: Review[];
  description?: string | null;
  isLoggedIn: boolean;
};

const Star = ({ filled = true }: { filled?: boolean }) => (
  <svg
    className={`w-4 h-4 ${filled ? 'text-[#f5a623]' : 'text-stone-300'}`}
    fill="currentColor"
    viewBox="0 0 20 20"
  >
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

export default function ProductReviews({
  productId,
  productTitle,
  reviews,
  description,
  isLoggedIn,
}: ProductReviewsProps) {
  const [activeTab, setActiveTab] = useState<'desc' | 'reviews'>('desc');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const t = useTranslations('Product');
  const locale = useLocale();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: '', text: '' });

    const res = await submitReview(productId, rating, comment);

    if (res.error) {
      setMsg({ type: 'error', text: res.error });
    } else {
      setMsg({ type: 'success', text: t('review_submitted') });
      setComment('');
      setRating(5);
    }
    setLoading(false);
  };

  return (
    <div className="mt-10 sm:mt-12 border border-stone-200 rounded-[4px] bg-white overflow-hidden">
      {/* Minimalist Centered Tab Header Bar */}
      <div className="flex items-center justify-center gap-8 border-b border-stone-200 px-4">
        <button
          type="button"
          onClick={() => setActiveTab('desc')}
          className={`py-4 text-[14.5px] transition-colors cursor-pointer relative -mb-px ${
            activeTab === 'desc'
              ? 'text-stone-900 font-medium border-b-2 border-[#e05246]'
              : 'text-stone-500 hover:text-stone-800 font-normal border-b-2 border-transparent'
          }`}
        >
          {t('description_tab')}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('reviews')}
          className={`py-4 text-[14.5px] transition-colors cursor-pointer relative -mb-px ${
            activeTab === 'reviews'
              ? 'text-stone-900 font-medium border-b-2 border-[#e05246]'
              : 'text-stone-500 hover:text-stone-800 font-normal border-b-2 border-transparent'
          }`}
        >
          {t('reviews_tab', { count: reviews.length })}
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-5 sm:p-8 bg-white">
        {activeTab === 'desc' ? (
          <div className="text-[13.5px] text-stone-600 leading-relaxed">
            {description ? (
              <div className="w-full overflow-x-auto">
                <SafeHTML
                  html={description}
                  className="prose prose-sm max-w-none w-full text-stone-600 whitespace-normal [&_table]:w-full [&_table]:border-collapse [&_tr]:border-b [&_tr]:border-stone-100 [&_td]:py-2.5 [&_td]:px-2 [&_td]:align-top [&_th]:py-2.5 [&_th]:px-2 [&_th]:text-left [&_th]:font-medium [&_th]:text-stone-700 [&_h2]:text-stone-800 [&_h3]:text-stone-800 [&_strong]:text-stone-800"
                />
              </div>
            ) : (
              <p className="text-stone-500">{t('no_description')}</p>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Existing Reviews */}
            <div>
              <h3 className="text-[15px] font-semibold mb-2 text-stone-800">
                {t('customer_reviews_title')} {reviews.length > 0 ? `(${reviews.length})` : ''}
              </h3>
              {reviews.length === 0 ? (
                <p className="text-stone-500 text-[13px]">{t('no_reviews_yet')}</p>
              ) : (
                <div className="space-y-6 mt-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-stone-100 pb-5 last:border-b-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star key={i} filled={i <= review.rating} />
                          ))}
                        </div>
                        <span className="text-[13.5px] font-semibold text-stone-800">
                          {review.reviewerName || 'Kunde'}
                        </span>
                        <span className="text-xs text-stone-400">
                          – {new Date(review.createdAt).toLocaleDateString(locale || 'de-DE')}
                        </span>
                      </div>
                      <p className="text-[13.5px] text-stone-600 leading-relaxed">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Review Submission Form */}
            <div className="pt-4 border-t border-stone-100">
              <h4 className="text-[14px] font-semibold text-stone-800 mb-1">
                {t('be_first_to_review', { name: productTitle || 'dieses Produkt' })}
              </h4>
              <p className="text-xs text-stone-500 mb-5">
                {t('email_not_published')}
              </p>

              {!isLoggedIn ? (
                <p className="text-[13.5px] text-stone-600">
                  {t('must_be_logged_in')}{' '}
                  <a href="/login" className="text-[#00a86b] font-medium hover:underline">
                    {t('login')}
                  </a>
                </p>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {msg.text && (
                    <div
                      className={`p-3 rounded-[4px] text-sm ${
                        msg.type === 'error'
                          ? 'bg-red-50 text-red-600 border border-red-100'
                          : 'bg-emerald-50 text-[#00a86b] border border-emerald-100'
                      }`}
                    >
                      {msg.text}
                    </div>
                  )}

                  {/* Rating Stars */}
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-semibold text-stone-700">
                      {t('your_rating_text')}
                    </label>
                    <div className="flex gap-1 cursor-pointer">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setRating(star)}
                          aria-label={`${star} Sterne`}
                          className="cursor-pointer"
                        >
                          <svg
                            className={`w-5 h-5 ${
                              star <= rating ? 'text-[#f5a623]' : 'text-stone-300'
                            } hover:text-[#f5a623] transition-colors`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comment */}
                  <div>
                    <textarea
                      required
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={5}
                      className="w-full px-4 py-3 border border-stone-200 rounded-[4px] focus:ring-1 focus:ring-[#00a86b]/30 focus:border-[#00a86b] outline-none text-sm text-stone-700 bg-white"
                      placeholder={t('your_review_placeholder')}
                    />
                  </div>

                  {/* Name & Email */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder={t('name_placeholder')}
                      className="w-full px-4 py-2.5 border border-stone-200 rounded-[4px] focus:ring-1 focus:ring-[#00a86b]/30 focus:border-[#00a86b] outline-none text-sm text-stone-700 bg-white"
                    />
                    <input
                      type="email"
                      placeholder={t('email_placeholder')}
                      className="w-full px-4 py-2.5 border border-stone-200 rounded-[4px] focus:ring-1 focus:ring-[#00a86b]/30 focus:border-[#00a86b] outline-none text-sm text-stone-700 bg-white"
                    />
                  </div>

                  {/* Checkbox */}
                  <div className="flex items-start gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="save-info"
                      className="mt-0.5 w-3.5 h-3.5 accent-[#00a86b] border-stone-300 rounded-sm"
                    />
                    <label htmlFor="save-info" className="text-[11.5px] text-stone-500">
                      {t('save_info')}
                    </label>
                  </div>

                  {/* Submit */}
                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-[#00a86b] hover:bg-[#008f5a] text-white font-semibold py-2.5 px-7 rounded-[4px] disabled:opacity-50 transition-colors text-sm cursor-pointer"
                    >
                      {loading ? t('sending') : t('submit_review')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
