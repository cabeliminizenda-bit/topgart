/**
 * Direct URL helper for components using native <img>, inline CSS backgrounds,
 * or server components that need pre-optimized Cloudinary URLs.
 */
export function getOptimizedImageUrl(
  src: string | null | undefined,
  width: number = 600,
  quality: number | 'auto' = 'auto'
): string {
  if (!src || typeof src !== 'string') return '';

  if (src.includes('res.cloudinary.com') && src.includes('/image/upload/')) {
    if (src.includes('/f_auto') || src.includes('/q_auto')) {
      return src;
    }

    const uploadIndex = src.indexOf('/image/upload/');
    const prefix = src.slice(0, uploadIndex + '/image/upload/'.length);
    const suffix = src.slice(uploadIndex + '/image/upload/'.length);
    const q = quality === 'auto' ? 'q_auto' : `q_${quality}`;
    const w = width ? `w_${width},c_limit` : 'w_600,c_limit';
    return `${prefix}f_auto,${q},${w}/${suffix}`;
  }

  return src;
}
