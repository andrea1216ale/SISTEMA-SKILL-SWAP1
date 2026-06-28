import { renderHomePage } from './pages/home-page.js';
import { renderLoginPage } from './pages/login-page.js';
import { renderRegisterPage } from './pages/register-page.js';
import { renderDashboardPage } from './pages/dashboard.js';
import { renderProfilePage } from './pages/profile.js';
import { renderSearchPage } from './pages/search.js';

const panelPages = {
  dashboard: {
    path: 'dashboard.html',
    title: 'Inicio | Skill Swap',
    render: renderDashboardPage
  },
  search: {
    path: 'search.html',
    title: 'Buscar habilidades | Skill Swap',
    stylesheet: 'css/search.css',
    render: renderSearchPage
  },
  profile: {
    path: 'profile.html',
    title: 'Perfil | Skill Swap',
    stylesheet: 'css/profile.css',
    render: renderProfilePage
  }
};

function pageFromUrl(url = window.location.href) {
  const filename = new URL(url, window.location.href).pathname.split('/').pop() || 'dashboard.html';
  return Object.keys(panelPages).find((page) => panelPages[page].path === filename);
}

function ensureStylesheet(href) {
  if (!href || document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

function updateSidebar(page) {
  document.querySelectorAll('.dash-sidebar a').forEach((link) => {
    const linkPage = pageFromUrl(link.href);
    link.classList.toggle('is-active', linkPage === page && linkPage !== undefined);
  });
}

let navigationId = 0;

async function navigatePanel(page, url, { history = true } = {}) {
  const config = panelPages[page];
  const currentMain = document.querySelector('#app .dash-layout > main');
  if (!config || !currentMain) {
    window.location.href = url;
    return;
  }

  if (history) window.history.pushState({ page }, '', url);
  ensureStylesheet(config.stylesheet);
  document.body.dataset.page = page;
  document.title = config.title;
  updateSidebar(page);

  const requestId = ++navigationId;
  currentMain.setAttribute('aria-busy', 'true');
  const staging = document.createElement('div');
  await config.render(staging);
  if (requestId !== navigationId) return;

  const nextMain = staging.querySelector('.dash-layout > main');
  if (!nextMain) {
    window.location.href = url;
    return;
  }
  currentMain.replaceWith(nextMain);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

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
    default:
      renderHomePage(app);
  }

  app.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const url = new URL(link.href, window.location.href);
    const nextPage = pageFromUrl(url.href);
    if (!nextPage || url.origin !== window.location.origin || !document.querySelector('.dash-sidebar')) return;

    event.preventDefault();
    navigatePanel(nextPage, `${url.pathname.split('/').pop()}${url.search}${url.hash}`);
  });

  window.addEventListener('popstate', () => {
    const nextPage = pageFromUrl();
    if (nextPage && document.querySelector('.dash-sidebar')) {
      navigatePanel(nextPage, window.location.href, { history: false });
    }
  });
});
