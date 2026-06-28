export const API_BASE_URL = 'http://localhost:3000/api';

export async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  return response.json();
}
