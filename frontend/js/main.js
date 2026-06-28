import { renderHomePage } from './pages/home-page.js';
import { renderLoginPage } from './pages/login-page.js';
import { renderRegisterPage } from './pages/register-page.js';
import { renderDashboardPage } from './pages/dashboard.js';

document.addEventListener('DOMContentLoaded', () => {
  const app = document.querySelector('#app');
  const page = document.body.dataset.page || 'home';

  if (!app) {
    console.warn('No se encontró el contenedor #app');
    return;
  }

  switch (page) {
    case 'login':
      renderLoginPage(app);
      break;
    case 'register':
      renderRegisterPage(app);
      break;
    case 'dashboard':
      renderDashboardPage(app);
      break;
    default:
      renderHomePage(app);
  }
});
