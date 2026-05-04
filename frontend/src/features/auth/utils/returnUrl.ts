const LOGIN_RETURN_PARAM = 'returnUrl';
const LEGACY_RETURN_PARAM = 'redirect';

export function safeReturnPath(raw: string | null | undefined, fallback = '/'): string {
  if (!raw || typeof raw !== 'string') return fallback;
  const trimmed = raw.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return fallback;
  return trimmed;
}

export function resolveAuthReturnUrl(
  searchParams: Pick<URLSearchParams, 'get'> | null | undefined,
  fallback: string,
): string {
  const raw =
    searchParams?.get(LOGIN_RETURN_PARAM) ??
    searchParams?.get(LEGACY_RETURN_PARAM) ??
    null;
  return safeReturnPath(raw, fallback);
}

export function appendQueryParam(path: string, key: string, value: string | null | undefined): string {
  if (!value) return path;
  const [pathname, hash = ''] = path.split('#');
  const [base, query = ''] = pathname.split('?');
  const params = new URLSearchParams(query);
  params.set(key, value);
  const nextQuery = params.toString();
  return `${base}${nextQuery ? `?${nextQuery}` : ''}${hash ? `#${hash}` : ''}`;
}

export function withReturnUrl(path: string, returnUrl: string | null | undefined): string {
  const safePath = safeReturnPath(returnUrl, '');
  return safePath ? appendQueryParam(path, LOGIN_RETURN_PARAM, safePath) : path;
}
