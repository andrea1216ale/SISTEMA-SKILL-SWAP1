export function getToken() {
  return localStorage.getItem('skillSwapToken');
}

export function saveToken(token) {
  localStorage.setItem('skillSwapToken', token);
}

export function clearToken() {
  localStorage.removeItem('skillSwapToken');
}

const USER_KEY = 'skillSwapUser';

export function saveCurrentUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

export function clearCurrentUser() {
  localStorage.removeItem(USER_KEY);
}
