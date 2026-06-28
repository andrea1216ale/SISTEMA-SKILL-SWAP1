import { RegisterForm } from '../components/register-form.js';

export function renderRegisterPage(container) {
  new RegisterForm(container).render();
}
