const BASE = '';  // proxied via Vite → http://localhost:3002

function token() { return localStorage.getItem('kyroo_token'); }

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  auth: {
    register:       (email, password, name) => req('POST', '/api/auth/register', { email, password, name }),
    login:          (email, password)       => req('POST', '/api/auth/login',    { email, password }),
    forgotPassword: (email)                 => req('POST', '/api/auth/forgot-password', { email }),
  },
  plans: {
    list: ()   => req('GET', '/api/plans'),
    get:  (id) => req('GET', `/api/plans/${id}`),
  },
  questionnaire: {
    save: (data) => req('POST', '/api/questionnaire', data),
  },
  programs: {
    generate: (questionnaireId) => req('POST', '/api/programs/generate', { questionnaireId }),
    current:  ()                => req('GET',  '/api/programs/current'),
  },
  tracking: {
    today:       ()         => req('GET',  '/api/tracking/today'),
    toggleHabit: (id)       => req('POST', `/api/tracking/habits/${id}/toggle`),
    saveMood:    (moodIndex) => req('POST', '/api/tracking/mood', { moodIndex }),
  },
  profile: {
    get:    ()     => req('GET', '/api/profile'),
    update: (name) => req('PUT', '/api/profile', { name }),
  },
};
