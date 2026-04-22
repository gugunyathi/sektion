// Frontend API client — wraps fetch with auth, refresh, and base URL
// Use relative paths to avoid mixed content issues; always calls current origin

const BASE = import.meta.env.DEV ? (import.meta.env.VITE_API_URL ?? 'http://localhost:3000') : '';

const TOKENS_KEY = 'sektion.tokens.v1';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export function getTokens(): TokenPair | null {
  try {
    const raw = localStorage.getItem(TOKENS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setTokens(tokens: TokenPair): void {
  localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
}

export function clearTokens(): void {
  localStorage.removeItem(TOKENS_KEY);
}

// ── Core fetch wrapper ───────────────────────────────────

let refreshing: Promise<TokenPair | null> | null = null;

async function doRefresh(): Promise<TokenPair | null> {
  const tokens = getTokens();
  if (!tokens?.refreshToken) return null;

  const res = await fetch(`${BASE}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: tokens.refreshToken }),
  });

  if (!res.ok) {
    clearTokens();
    return null;
  }

  const data: TokenPair = await res.json();
  setTokens(data);
  return data;
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const tokens = getTokens();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (tokens?.accessToken) {
    headers['Authorization'] = `Bearer ${tokens.accessToken}`;
  }

  // Remove Content-Type for FormData so browser sets boundary
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (res.status === 401 && retry) {
    // Try to refresh once
    if (!refreshing) refreshing = doRefresh().finally(() => { refreshing = null; });
    const newTokens = await refreshing;
    if (newTokens) {
      return apiFetch<T>(path, options, false);
    }
    // Refresh failed — clear and rethrow
    clearTokens();
    const err = await res.json().catch(() => ({ error: 'Unauthorized' }));
    throw Object.assign(new Error(err.error ?? 'Unauthorized'), { status: 401 });
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw Object.assign(new Error(err.error ?? res.statusText), { status: res.status });
  }

  // 204 No Content
  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

// ── Public methods ───────────────────────────────────────

export const api = {
  get<T>(path: string): Promise<T> {
    return apiFetch<T>(path);
  },
  post<T>(path: string, body?: unknown): Promise<T> {
    return apiFetch<T>(path, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  },
  patch<T>(path: string, body?: unknown): Promise<T> {
    return apiFetch<T>(path, {
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  },
  put<T>(path: string, body?: unknown): Promise<T> {
    return apiFetch<T>(path, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  },
  delete<T>(path: string): Promise<T> {
    return apiFetch<T>(path, { method: 'DELETE' });
  },
  /** Upload a file via multipart/form-data */
  upload<T>(path: string, formData: FormData): Promise<T> {
    return apiFetch<T>(path, { method: 'POST', body: formData });
  },
};
