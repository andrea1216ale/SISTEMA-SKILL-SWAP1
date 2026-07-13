import { getCurrentUser, clearCurrentUser } from '../common/auth.js';
import {
  actualizarPreferenciasNotificaciones,
  eliminarNotificacion,
  marcarNotificacionLeida,
  marcarTodasNotificacionesLeidas,
  obtenerNotificaciones,
  obtenerPreferenciasNotificaciones
} from '../services/api.js';
import { renderSidebar } from './dashboard.js';

const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  "'": '&#39;',
  '"': '&quot;'
}[character]));

const typeMeta = {
  INTERCAMBIO: { label: 'Intercambios', icon: '🤝', color: 'blue' },
  CHAT: { label: 'Chat', icon: '💬', color: 'green' },
  SESION: { label: 'Sesiones', icon: '📅', color: 'purple' },
  CALIFICACION: { label: 'Calificaciones', icon: '⭐', color: 'yellow' },
  PUBLICACION: { label: 'Publicaciones', icon: '📰', color: 'cyan' },
  SISTEMA: { label: 'Sistema', icon: '⚙️', color: 'gray' },
  SEGURIDAD: { label: 'Seguridad', icon: '🔒', color: 'red' },
  RECOMENDACION: { label: 'IA', icon: '💡', color: 'lime' },
  RESUMEN: { label: 'Resumen', icon: '📊', color: 'slate' }
};

const priorityLabels = {
  URGENTE: 'Urgente',
  ALTA: 'Alta',
  MEDIA: 'Media',
  BAJA: 'Baja'
};

const filterOptions = [
  { value: '', label: 'Todas' },
  { value: 'no_leidas', label: 'No leidas', key: 'estado' },
  { value: 'CHAT', label: 'Mensajes', key: 'tipo' },
  { value: 'INTERCAMBIO', label: 'Intercambios', key: 'tipo' },
  { value: 'SESION', label: 'Sesiones', key: 'tipo' },
  { value: 'SISTEMA', label: 'Sistema', key: 'tipo' }
];

const preferenceLabels = [
  ['notificar_mensajes', 'Mensajes'],
  ['notificar_intercambios', 'Solicitudes'],
  ['notificar_sesiones', 'Sesiones'],
  ['notificar_calificaciones', 'Calificaciones'],
  ['notificar_publicaciones', 'Publicaciones'],
  ['notificar_recomendaciones', 'Recomendaciones IA'],
  ['recibir_por_correo', 'Correos'],
  ['recibir_resumen_diario', 'Resumen diario'],
  ['recordar_sesion_24_horas', 'Sesion 24 horas antes'],
  ['recordar_sesion_1_hora', 'Sesion 1 hora antes'],
  ['recordar_sesion_10_minutos', 'Sesion 10 minutos antes']
];

function relativeTime(value) {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Ahora';
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Ayer';
  if (days < 7) return `Hace ${days} dias`;
  return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
}

function dayGroup(value) {
  const date = value ? new Date(value) : new Date();
  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diff = Math.round((startToday - startDate) / 86400000);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  return date.toLocaleDateString('es-PE', { weekday: 'long', day: '2-digit', month: 'long' });
}

function actionHref(route) {
  if (!route) return '#';
  if (/^https?:\/\//i.test(route)) return route;
  return route.replace(/^\//, '');
}

function renderFilters(activeFilter) {
  return `<div class="notif-filters" role="group" aria-label="Filtros de notificaciones">
    ${filterOptions.map((option) => `<button type="button" data-filter-key="${option.key || ''}" data-filter-value="${option.value}" class="${activeFilter === option.label ? 'is-active' : ''}">${escapeHtml(option.label)}</button>`).join('')}
  </div>`;
}

function renderNotification(item) {
  const meta = typeMeta[item.tipo] || typeMeta.SISTEMA;
  const priority = String(item.prioridad || 'MEDIA').toUpperCase();
  const actor = item.usuario_origen_nombre ? `<strong>${escapeHtml(item.usuario_origen_nombre)}</strong>` : '';
  const grouped = Number(item.cantidad_agrupada || 1) > 1 ? `<span class="notif-grouped">${Number(item.cantidad_agrupada)} nuevos</span>` : '';
  const image = item.imagen_url
    ? `<img class="notif-avatar-img" src="${escapeHtml(item.imagen_url)}" alt="">`
    : `<span class="notif-icon notif-icon--${meta.color}" aria-hidden="true">${meta.icon}</span>`;
  const actions = (item.acciones || []).map((action) =>
    `<a class="notif-action notif-action--${String(action.estilo || 'SECUNDARIA').toLowerCase()}" href="${escapeHtml(actionHref(action.ruta))}">${escapeHtml(action.etiqueta)}</a>`
  ).join('');

  return `<article class="notif-card notif-card--${meta.color} ${item.leida ? 'is-read' : 'is-unread'} ${item.fijada ? 'is-pinned' : ''}" data-id="${Number(item.id_notificacion)}">
    <div class="notif-read-dot" aria-hidden="true"></div>
    <div class="notif-media">${image}</div>
    <div class="notif-body">
      <header>
        <div>
          <span class="notif-type">${escapeHtml(meta.label)}</span>
          <h3>${item.fijada ? '<span class="notif-pin">📌</span>' : ''}${escapeHtml(item.titulo || 'Notificacion')}</h3>
        </div>
        <time>${relativeTime(item.fecha_creacion)}</time>
      </header>
      <p>${actor} ${escapeHtml(item.mensaje || '')}</p>
      ${grouped}
      <div class="notif-card__footer">
        <span class="notif-priority notif-priority--${priority.toLowerCase()}">${escapeHtml(priorityLabels[priority] || priority)}</span>
        <div class="notif-actions">${actions}</div>
      </div>
    </div>
    <div class="notif-tools">
      ${item.leida ? '' : '<button type="button" data-action="read" title="Marcar como leida">✓</button>'}
      <button type="button" data-action="delete" title="Eliminar">×</button>
    </div>
  </article>`;
}

function renderGroupedNotifications(notifications) {
  if (!notifications.length) {
    return '<div class="notif-empty"><strong>No hay notificaciones</strong><p>Cuando ocurra algo importante en Skill Swap aparecera aqui.</p></div>';
  }

  const groups = notifications.reduce((map, item) => {
    const key = dayGroup(item.fecha_creacion);
    const list = map.get(key) || [];
    list.push(item);
    map.set(key, list);
    return map;
  }, new Map());

  return Array.from(groups.entries()).map(([group, items]) => `
    <section class="notif-day">
      <h2>${escapeHtml(group)}</h2>
      <div class="notif-day__line"></div>
      <div class="notif-list">${items.map(renderNotification).join('')}</div>
    </section>
  `).join('');
}

function renderPreferences(preferences = {}) {
  return `<form class="notif-settings" id="notificationSettings">
    <header>
      <p>Configuracion</p>
      <h2>Preferencias</h2>
    </header>
    <div class="notif-setting-list">
      ${preferenceLabels.map(([key, label]) => `
        <label class="notif-toggle">
          <span>${escapeHtml(label)}</span>
          <input type="checkbox" name="${escapeHtml(key)}" ${preferences[key] ? 'checked' : ''}>
        </label>
      `).join('')}
    </div>
    <label class="notif-time">
      <span>Hora del resumen</span>
      <input type="time" name="hora_resumen" value="${escapeHtml(String(preferences.hora_resumen || '20:00:00').slice(0, 5))}">
    </label>
    <button type="submit">Guardar preferencias</button>
    <p class="notif-settings__feedback" hidden></p>
  </form>`;
}

function renderMetrics(summary = {}) {
  return `<section class="notif-metrics" aria-label="Resumen de notificaciones">
    <article><span>No leidas</span><strong>${Number(summary.no_leidas || 0)}</strong></article>
    <article><span>Importantes</span><strong>${Number(summary.importantes || 0)}</strong></article>
    <article><span>Fijadas</span><strong>${Number(summary.fijadas || 0)}</strong></article>
  </section>`;
}

export async function renderNotificationsPage(container) {
  const user = getCurrentUser();
  if (!user?.id_usuario) {
    window.location.href = 'login.html';
    return;
  }

  const displayName = user.nombre || [user.nombres, user.apellido_paterno].filter(Boolean).join(' ') || 'Usuario';
  let notifications = [];
  let preferences = {};
  let summary = {};
  let filters = { estado: '', tipo: '', buscar: '' };
  let activeFilter = 'Todas';

  container.innerHTML = `<div class="dash-layout notif-shell">
    ${renderSidebar({ nombre: displayName, correo: user.correo || '' }, 'notifications')}
    <main class="notif-main">
      <header class="notif-heading">
        <div>
          <p>Centro de actividades</p>
          <h1>Notificaciones</h1>
          <span>Revisa mensajes, intercambios, sesiones, calificaciones y avisos importantes.</span>
        </div>
      </header>
      <div class="notif-content">
        <section class="notif-board">
          <div class="notif-search">
            <input id="notificationSearch" type="search" placeholder="Buscar notificacion..." autocomplete="off">
          </div>
          <div id="notificationFilters">${renderFilters(activeFilter)}</div>
          <div id="notificationMetrics">${renderMetrics(summary)}</div>
          <div id="notificationList" aria-live="polite"><div class="notif-loading"><i></i><p>Cargando notificaciones...</p></div></div>
        </section>
      </div>
    </main>
  </div>`;

  const list = container.querySelector('#notificationList');
  const metrics = container.querySelector('#notificationMetrics');
  const filtersEl = container.querySelector('#notificationFilters');
  const searchInput = container.querySelector('#notificationSearch');

  function paint() {
    metrics.innerHTML = renderMetrics(summary);
    filtersEl.innerHTML = renderFilters(activeFilter);
    list.innerHTML = renderGroupedNotifications(notifications);
  }

  async function load() {
    list.innerHTML = '<div class="notif-loading"><i></i><p>Cargando notificaciones...</p></div>';
    const [response, prefResponse] = await Promise.all([
      obtenerNotificaciones(user.id_usuario, filters),
      obtenerPreferenciasNotificaciones(user.id_usuario)
    ]);

    if (!response.success) {
      list.innerHTML = `<div class="notif-empty notif-empty--error"><strong>No pudimos cargar tus notificaciones</strong><p>${escapeHtml(response.message || response.error)}</p><button type="button" id="retryNotifications">Intentar nuevamente</button></div>`;
      list.querySelector('#retryNotifications')?.addEventListener('click', load);
      return;
    }

    notifications = response.data?.notificaciones || [];
    summary = response.data?.resumen || {};
    preferences = prefResponse.success ? (prefResponse.data || {}) : {};
    paint();
  }

  filtersEl.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-filter-value]');
    if (!button) return;
    activeFilter = button.textContent.trim();
    filters.estado = '';
    filters.tipo = '';
    if (button.dataset.filterKey) filters[button.dataset.filterKey] = button.dataset.filterValue;
    await load();
  });

  let searchTimer = null;
  searchInput.addEventListener('input', () => {
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(async () => {
      filters.buscar = searchInput.value.trim();
      await load();
      searchInput.focus();
      searchInput.value = filters.buscar;
    }, 300);
  });

  list.addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const card = button.closest('[data-id]');
    const id = Number(card?.dataset.id);
    if (!id) return;

    button.disabled = true;
    const response = button.dataset.action === 'read'
      ? await marcarNotificacionLeida(user.id_usuario, id)
      : await eliminarNotificacion(user.id_usuario, id);

    if (response.success) await load();
    else button.disabled = false;
  });

  container.querySelector('#logoutButton')?.addEventListener('click', () => {
    clearCurrentUser();
    window.location.href = 'login.html';
  });

  await load();
}
