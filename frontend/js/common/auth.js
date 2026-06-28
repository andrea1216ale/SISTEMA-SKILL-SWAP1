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

export function saveCurrentUser(user, remember = true) {
  clearCurrentUser();
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(USER_KEY, JSON.stringify(user));
}

export function getCurrentUser() {
  try {
    const savedUser = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    return savedUser ? JSON.parse(savedUser) : null;
  } catch {
    return null;
  }
}

export function clearCurrentUser() {
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(USER_KEY);
}
