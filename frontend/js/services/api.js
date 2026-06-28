const API_BASE_URL = 'http://localhost:3000/api';

async function request(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = await response.json();
    if (!response.ok) return { error: data.error || 'Ocurrió un error en el servidor.' };
    return data;
  } catch {
    return { error: 'No se pudo conectar con el servidor.' };
  }
}

export async function registerUser(usuario) {
  return request('/registro', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(usuario)
  });

}

export async function loginUser(credentials) {
  return request('/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(credentials)
  });

}

export function getDashboard(userId) {
  return request(`/dashboard/${encodeURIComponent(userId)}`);
}
