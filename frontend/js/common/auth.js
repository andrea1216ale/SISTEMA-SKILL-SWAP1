export function getToken() {
  return localStorage.getItem('skillSwapToken');
}

export function saveToken(token) {
  localStorage.setItem('skillSwapToken', token);
}

export function clearToken() {
  localStorage.removeItem('skillSwapToken');
}
