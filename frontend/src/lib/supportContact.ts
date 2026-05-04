/** Official support inbox — account menus & feedback CTAs. */
export const GOSELLR_SUPPORT_EMAIL = 'gosellr.ehb@gmail.com';

export function mailtoSupportHref(subject: string, body?: string): string {
  const q = new URLSearchParams();
  q.set('subject', subject);
  if (body?.trim()) q.set('body', body.trim());
  return `mailto:${GOSELLR_SUPPORT_EMAIL}?${q.toString()}`;
}
