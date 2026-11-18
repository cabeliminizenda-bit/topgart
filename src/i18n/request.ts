import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async () => {
  // 100% Deutsch (Top Gartengeräte)
  const locale = 'de';
  const messages = (await import('../../messages/de.json')).default;

  return {
    locale,
    messages,
  };
});
