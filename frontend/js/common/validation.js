export function validateEmail(email) {
  return /\S+@\S+\.\S+/.test(email);
}

export function validateRequired(value) {
  return value != null && value.toString().trim() !== '';
}
