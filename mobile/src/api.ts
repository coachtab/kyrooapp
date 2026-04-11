import AsyncStorage from '@react-native-async-storage/async-storage';

// In production (kyroo.de), use same origin so nginx proxies /api/.
// In dev (expo dev server on port 8081/19006), the dev server doesn't
// proxy /api/ so we fall back to the local backend on port 3002.
function resolveApiBase(): string {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  if (typeof window !== 'undefined') {
    const port = window.location.port;
    // Standard ports (80/443/empty) = production behind nginx
    if (!port || port === '80' || port === '443') return window.location.origin;
  }
  return 'http://localhost:3002';
}
const API_BASE = resolveApiBase();

export type ProgramStatus = 'active' | 'queued' | 'paused' | 'completed';

async function req(method: string, path: string, body?: unknown, tok?: string) {
  const token = tok ?? (await AsyncStorage.getItem('kyroo_token'));
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
  return data;
}

export const api = {
  auth: {
    register:       (email: string, password: string)                    => req('POST', '/api/auth/register', { email, password }),
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
