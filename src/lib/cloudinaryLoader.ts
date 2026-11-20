'use client';

/**
 * Cloudinary custom image loader for Next.js.
 * Transforms raw Cloudinary URLs on the fly to auto-format (f_auto -> AVIF/WebP),
 * auto-compress (q_auto), and scale down to the requested display width (w_{width},c_limit).
 *
 * This offloads all image transformations to Cloudinary's free global CDN edge and
 * bypasses Vercel's 5,000 transformation free-tier limit completely!
 */
export default function cloudinaryLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  if (!src || typeof src !== 'string') return '';

  if (src.includes('res.cloudinary.com') && src.includes('/image/upload/')) {
    // If already has transformation parameters right after /image/upload/, return as is
    if (src.includes('/f_auto') || src.includes('/q_auto')) {
      return src;
    }

    const uploadIndex = src.indexOf('/image/upload/');
    const prefix = src.slice(0, uploadIndex + '/image/upload/'.length);
    const suffix = src.slice(uploadIndex + '/image/upload/'.length);
    const q = quality && quality <= 80 ? `q_${quality}` : 'q_auto:good';
    const w = width ? `w_${width},c_limit` : 'w_600,c_limit';
    return `${prefix}f_auto,${q},${w}/${suffix}`;
  }

  // Local images (/images/...) or external images return untouched
  return src;
}
