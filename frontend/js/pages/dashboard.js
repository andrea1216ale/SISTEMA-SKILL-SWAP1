import { getCurrentUser, clearCurrentUser } from '../common/auth.js';
import { getDashboard } from '../services/api.js';

const icons = {
  spark: '<path d="M12 3c.8 5.3 2.4 6.9 7.7 7.7-5.3.8-6.9 2.4-7.7 7.7-.8-5.3-2.4-6.9-7.7-7.7C9.6 9.9 11.2 8.3 12 3Z"/><path d="M19 3v4M17 5h4"/>',
  home: '<path d="m3 11 9-8 9 8v9H5v-9"/><path d="M9 20v-6h6v6"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M3 20v-2c0-3 2.7-5 6-5s6 2 6 5v2M16 6a3 3 0 0 1 0 6M18 14c2 .7 3 2.2 3 4v2"/>',
  message: '<path d="M4 5h16v12H8l-4 4V5Z"/>',
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z"/>',
  bell: '<path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7M10 20h4"/>',
  user: '<circle cx="12" cy="7" r="4"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/>',
  logout: '<path d="M10 4H5v16h5M14 8l4 4-4 4M8 12h10"/>',
  book: '<path d="M4 5a4 4 0 0 1 4-2h4v16H8a4 4 0 0 0-4 2V5ZM20 5a4 4 0 0 0-4-2h-4v16h4a4 4 0 0 1 4 2V5Z"/>',
  bolt: '<path d="m13 2-9 12h7l-1 8 9-12h-7l1-8Z"/>',
  trend: '<path d="m3 17 6-6 4 4 8-9M15 6h6v6"/>'
};

function icon(name) {
  return `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icons[name]}</svg>`;
}

const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
const initial = (value = '?') => escapeHtml(value.trim().charAt(0).toUpperCase() || '?');

export function renderSidebar(user, activePage = 'dashboard') {
  return `
    <aside class="dash-sidebar">
      <a class="dash-brand" href="dashboard.html"><span>${icon('spark')}</span>Skill Swap</a>
      <div class="dash-user"><span class="dash-avatar">${initial(user.nombre)}</span><div><strong>${escapeHtml(user.nombre)}</strong><small>${escapeHtml(user.correo)}</small></div></div>
      <nav class="dash-nav" aria-label="Navegación principal">
        <a class="${activePage === 'dashboard' ? 'is-active' : ''}" href="dashboard.html">${icon('home')}<span>Inicio</span></a>
        <a class="${activePage === 'search' ? 'is-active' : ''}" href="search.html">${icon('search')}<span>Buscar</span></a>
        <a class="${activePage === 'feed' ? 'is-active' : ''}" href="feed.html">${icon('plus')}<span>Comunidad</span></a>
        <a class="${activePage === 'exchanges' ? 'is-active' : ''}" href="exchanges.html">${icon('users')}<span>Intercambios</span></a>
        <a class="${activePage === 'chat' ? 'is-active' : ''}" href="chat.html">${icon('message')}<span>Mensajes</span></a>
        <a class="${activePage === 'ratings' ? 'is-active' : ''}" href="ratings.html">${icon('star')}<span>Calificaciones</span></a>
      </nav>
      <nav class="dash-nav dash-nav--bottom" aria-label="Cuenta">
        <a href="#notifications">${icon('bell')}<span>Notificaciones</span></a>
        <a class="${activePage === 'profile' ? 'is-active' : ''}" href="profile.html">${icon('user')}<span>Mi perfil</span></a>
        <button type="button" id="logoutButton">${icon('logout')}<span>Cerrar sesión</span></button>
      </nav>
    </aside>`;
}

function renderMetric(iconName, value, label, variant) {
  return `<article class="dash-metric dash-metric--${variant}"><span class="dash-metric__icon">${icon(iconName)}</span><strong>${escapeHtml(value)}</strong><p>${label}</p></article>`;
}

function renderContent(data) {
  const skills = data.popularSkills.map((skill) => `
    <li><span class="dash-list-avatar">${initial(skill.nombre)}</span><div><strong>${escapeHtml(skill.nombre)}</strong><small>${escapeHtml(skill.categoria || 'Sin categoría')}</small></div><p><b>${Number(skill.usuarios).toLocaleString('es-PE')}</b><small>usuarios</small></p></li>`).join('');
  const users = data.recommendedUsers.map((user) => `
    <li><span class="dash-list-avatar">${initial(user.nombre)}</span><div><strong>${escapeHtml(user.nombre)}</strong><small>${escapeHtml(user.habilidades)}</small></div><p class="dash-rating"><b>${Number(user.rating).toFixed(1)} ★</b><small>${Number(user.intercambios)} intercambios</small></p></li>`).join('');

  return `
    <div class="dash-layout">
      ${renderSidebar(data.user)}
      <main class="dash-main">
        <header class="dash-heading"><p>Panel de comunidad</p><h1>¡Bienvenido, ${escapeHtml(data.user.nombre.split(' ')[0])}!</h1><span>Descubre nuevas habilidades y conecta con otros aprendices.</span></header>
        <section class="dash-metrics" aria-label="Resumen de Skill Swap">
          ${renderMetric('users', Number(data.metrics.usuarios).toLocaleString('es-PE'), 'Miembros registrados', 'teal')}
          ${renderMetric('book', Number(data.metrics.habilidades).toLocaleString('es-PE'), 'Habilidades disponibles', 'gold')}
          ${renderMetric('bolt', Number(data.metrics.intercambios_hoy).toLocaleString('es-PE'), 'Intercambios hoy', 'blue')}
          ${renderMetric('trend', Number(data.metrics.rating_promedio).toFixed(1), 'Calificación promedio', 'coral')}
        </section>
        <section class="dash-panels">
          <article class="dash-panel"><header><div><p>Lo más compartido</p><h2>Habilidades populares</h2></div><a href="skills.html">Ver todas</a></header><ul>${skills || '<li class="dash-empty">Aún no hay habilidades publicadas.</li>'}</ul></article>
          <article class="dash-panel"><header><div><p>Conexiones para ti</p><h2>Personas recomendadas</h2></div><a href="search.html">Explorar</a></header><ul>${users || '<li class="dash-empty">Aún no hay otros miembros para recomendar.</li>'}</ul></article>
        </section>
      </main>
    </div>`;
}

export async function renderDashboardPage(container) {
  const currentUser = getCurrentUser();
  if (!currentUser?.id_usuario) {
    window.location.href = 'login.html';
    return;
  }

  container.innerHTML = '<div class="dash-loading"><span></span><p>Cargando tu comunidad…</p></div>';
  const data = await getDashboard(currentUser.id_usuario);
  if (data.error) {
    container.innerHTML = `<div class="dash-error"><h1>No pudimos abrir tu panel</h1><p>${escapeHtml(data.error)}</p><button type="button" id="retryDashboard">Intentar nuevamente</button></div>`;
    container.querySelector('#retryDashboard').addEventListener('click', () => renderDashboardPage(container));
    return;
  }

  container.innerHTML = renderContent(data);
  container.querySelector('#logoutButton').addEventListener('click', () => {
    clearCurrentUser();
    window.location.href = 'login.html';
  });
}
