import AsyncStorage from '@react-native-async-storage/async-storage';

// In production (kyroo.de), use same origin so nginx proxies /api/.
// In dev (expo dev server on port 8081/19006), fall back to localhost:3002.
function resolveApiBase(): string {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  if (typeof window !== 'undefined') {
    const port = window.location.port;
    if (!port || port === '80' || port === '443') return window.location.origin;
  }
  return 'http://localhost:3002';
}
const API_BASE = resolveApiBase();

export type ProgramStatus = 'active' | 'queued' | 'paused' | 'completed';

// ── In-memory token cache — avoids AsyncStorage read on every request ────────
let _tokenCache: string | null = null;
let _tokenLoaded = false;

async function getToken(): Promise<string | null> {
  if (_tokenLoaded) return _tokenCache;
  _tokenCache = await AsyncStorage.getItem('kyroo_token');
  _tokenLoaded = true;
  return _tokenCache;
}

export function setTokenCache(token: string | null) {
  _tokenCache = token;
  _tokenLoaded = true;
}

// ── Request deduplication + GET cache ────────────────────────────────────────
const _inflight = new Map<string, Promise<any>>();
const _cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 15_000; // 15 seconds

async function req(method: string, path: string, body?: unknown, tok?: string) {
  const token = tok ?? (await getToken());

  // Dedup identical GET requests that are already in-flight
  const key = `${method}:${path}`;
  if (method === 'GET' && _inflight.has(key)) return _inflight.get(key);

  // Return cached GET if fresh enough
  if (method === 'GET') {
    const cached = _cache.get(key);
    if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;
  }

  const promise = (async () => {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Request failed');

    // Cache successful GET responses
    if (method === 'GET') _cache.set(key, { data, ts: Date.now() });

    return data;
  })();

  if (method === 'GET') {
    _inflight.set(key, promise);
    promise.finally(() => _inflight.delete(key));
  }

  // Mutations invalidate related caches
  if (method !== 'GET') {
    _cache.clear();
  }

  return promise;
}

export const api = {
  auth: {
    register:            (email: string, password: string)               => req('POST', '/api/auth/register', { email, password }),
    resendVerification:  (email: string)                                => req('POST', '/api/auth/resend-verification', { email }),
    login:          (email: string, password: string)                    => req('POST', '/api/auth/login',    { email, password }),
    forgotPassword: (email: string)                                      => req('POST', '/api/auth/forgot-password', { email }),
    changePassword: (currentPassword: string, newPassword: string)      => req('POST', '/api/auth/change-password', { currentPassword, newPassword }),
  },
  account: {
    delete: () => req('DELETE', '/api/account'),
  },
  plans: {
    list: ()          => req('GET', '/api/plans'),
    get:  (id: number) => req('GET', `/api/plans/${id}`),
  },
  questionnaire: {
    save: (data: Record<string, unknown>) => req('POST', '/api/questionnaire', data),
  },
  programs: {
    generate:  (questionnaireId: number)              => req('POST',  '/api/programs/generate', { questionnaireId }),
    current:   ()                                     => req('GET',   '/api/programs/current'),
    list:      ()                                     => req('GET',   '/api/programs'),
    setStatus: (id: number, status: ProgramStatus)   => req('PATCH', `/api/programs/${id}/status`, { status }),
  },
  tracking: {
    today:       ()                   => req('GET',  '/api/tracking/today'),
    toggleHabit: (id: number)         => req('POST', `/api/tracking/habits/${id}/toggle`),
    saveMood:    (moodIndex: number)  => req('POST', '/api/tracking/mood', { moodIndex }),
  },
  profile: {
    get:    (tok?: string)  => req('GET', '/api/profile', undefined, tok),
    update: (name: string)  => req('PUT', '/api/profile', { name }),
  },
};
