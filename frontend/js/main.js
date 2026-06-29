import { renderHomePage } from './pages/home-page.js';
import { renderLoginPage } from './pages/login-page.js';
import { renderRegisterPage } from './pages/register-page.js';
import { renderDashboardPage } from './pages/dashboard.js';
import { renderProfilePage } from './pages/profile.js';
import { renderSearchPage } from './pages/search.js';
import { renderFeedPage } from './pages/feed.js';
import { renderExchangesPage } from './pages/exchanges.js';
import { renderChatPage } from './pages/chat.js';
import { mountSkillbot } from './components/skillbot-widget.js';

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
    case 'profile':
      renderProfilePage(app);
      break;
    case 'search':
      renderSearchPage(app);
      break;
    case 'feed':
      renderFeedPage(app);
      break;
    case 'exchanges':
      renderExchangesPage(app);
      break;
    case 'chat':
      renderChatPage(app);
      break;
    default:
      renderHomePage(app);
  }

  if (!['login', 'register', 'home'].includes(page)) {
    mountSkillbot();
  }
});
