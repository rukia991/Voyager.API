const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY?.trim() ?? '';
const shouldBypassRecaptcha = import.meta.env.VITE_RECAPTCHA_BYPASS === 'true';

export default {
  siteKey,
  shouldBypassRecaptcha,
};
