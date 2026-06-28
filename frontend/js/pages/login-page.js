import { LoginForm } from '../components/login-form.js';

export function renderLoginPage(container) {
  new LoginForm(container).render();
}
