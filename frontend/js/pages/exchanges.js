import { getCurrentUser, clearCurrentUser } from '../common/auth.js';
import {
  aceptarSolicitud,
  obtenerSesionIntercambio,
  obtenerSolicitudes,
  rechazarSolicitud
} from '../services/intercambio.service.js';
import { renderSidebar } from './dashboard.js';

const estadoConfig = {
  PENDIENTE: { icon: 'clock', clase: 'badge-pending', label: 'Pendiente' },
  ACEPTADA: { icon: 'check', clase: 'badge-accepted', label: 'Aceptada' },
  RECHAZADA: { icon: 'x', clase: 'badge-rejected', label: 'Rechazada' },
  FINALIZADA: { icon: 'done', clase: 'badge-completed', label: 'Finalizada' },
  CANCELADA: { icon: 'minus', clase: 'badge-canceled', label: 'Cancelada' }
};

const icons = {
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  done: '<path d="m4 12 4 4L18 6"/><path d="m12 16 1 1 7-8"/>',
  minus: '<path d="M5 12h14"/>',
  calendar: '<path d="M7 3v4M17 3v4M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M5 21v-1a7 7 0 0 1 14 0v1"/>'
};

const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  "'": '&#39;',
  '"': '&quot;'
}[char]));

const initial = (value = '?') => escapeHtml(value.trim().charAt(0).toUpperCase() || '?');

function icon(name) {
  return `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icons[name]}</svg>`;
}

function estadoBadge(estado = 'PENDIENTE') {
  const config = estadoConfig[estado] || estadoConfig.PENDIENTE;
  return `<span class="exchange-badge ${config.clase}">${icon(config.icon)}${config.label}</span>`;
}

function formatearFecha(fecha) {
  if (!fecha) return 'Sin fecha';
  return new Date(fecha).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function formatearFechaHora(fecha) {
  if (!fecha) return 'Pendiente por programar';
  return new Date(fecha).toLocaleString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function renderAcciones(solicitud) {
  if (solicitud.estado === 'PENDIENTE') {
    return `
      <div class="exchange-actions">
        <button class="exchange-btn exchange-btn--primary" type="button" data-action="accept" data-id="${solicitud.id_intercambio}">
          Aceptar
        </button>
        <button class="exchange-btn exchange-btn--ghost" type="button" data-action="reject" data-id="${solicitud.id_intercambio}">
          Rechazar
        </button>
      </div>
    `;
  }

  if (solicitud.estado === 'ACEPTADA') {
    return `
      <div class="exchange-actions">
        <button class="exchange-btn exchange-btn--calendar" type="button" data-action="calendar" data-id="${solicitud.id_intercambio}">
          ${icon('calendar')}Ver Calendario
        </button>
      </div>
    `;
  }

  return '';
}

function renderCard(solicitud) {
  const nombre = solicitud.usuario_nombre || `${solicitud.nombre || ''} ${solicitud.apellido || ''}`.trim() || 'Usuario';
  const habilidad = solicitud.nombre_habilidad || 'Habilidad no especificada';
  const mensaje = solicitud.mensaje_solicitud
    ? `<p class="exchange-message">${escapeHtml(solicitud.mensaje_solicitud)}</p>`
    : '';

  return `
    <article class="exchange-card" data-id="${solicitud.id_intercambio}">
      <div class="exchange-header">
        <div class="exchange-user">
          <span class="exchange-avatar">${initial(nombre)}</span>
          <div class="exchange-info">
            <strong>${escapeHtml(nombre)}</strong>
            <small>${escapeHtml(habilidad)}</small>
          </div>
        </div>
        ${estadoBadge(solicitud.estado)}
      </div>
      ${mensaje}
      <div class="exchange-meta">
        <span>${icon('calendar')}Solicitud: ${formatearFecha(solicitud.fecha_solicitud)}</span>
      </div>
      ${renderAcciones(solicitud)}
    </article>
  `;
}

function renderShell(user) {
  return `
    <div class="dash-layout">
      ${renderSidebar(user, 'exchanges')}
      <main class="exchanges-main">
        <div class="exchanges-shell">
          <header class="exchanges-title">
            <p>Mis solicitudes</p>
            <h1>Solicitudes de Intercambio</h1>
            <span>Gestiona las solicitudes recibidas y revisa el calendario de tus intercambios aceptados.</span>
          </header>
          <div class="exchange-feedback" role="status" aria-live="polite" hidden></div>
          <section class="exchanges-list" aria-label="Solicitudes recibidas"></section>
        </div>
      </main>
      <div class="exchange-modal" id="exchangeCalendarModal" hidden>
        <div class="exchange-modal__backdrop" data-action="close-modal"></div>
        <section class="exchange-modal__panel" role="dialog" aria-modal="true" aria-labelledby="calendarTitle">
          <header>
            <div>
              <p>Calendario</p>
              <h2 id="calendarTitle">Sesion del intercambio</h2>
            </div>
            <button type="button" class="exchange-modal__close" data-action="close-modal" aria-label="Cerrar">x</button>
          </header>
          <div class="exchange-modal__body"></div>
        </section>
      </div>
    </div>
  `;
}

function renderLoading() {
  return '<div class="exchanges-loading"><span></span><p>Cargando solicitudes...</p></div>';
}

function renderEmpty() {
  return `
    <div class="exchanges-empty">
      <span>${icon('user')}</span>
      <strong>Por ahora no hay solicitudes de intercambio</strong>
      <p>Cuando otro usuario te proponga un intercambio, aparecera aqui.</p>
    </div>
  `;
}

function showFeedback(container, message, type = 'success') {
  const feedback = container.querySelector('.exchange-feedback');
  feedback.textContent = message;
  feedback.className = `exchange-feedback exchange-feedback--${type}`;
  feedback.hidden = false;
  window.setTimeout(() => {
    feedback.hidden = true;
  }, 3200);
}

function updateSolicitud(solicitudes, updated) {
  const index = solicitudes.findIndex((item) => Number(item.id_intercambio) === Number(updated.id_intercambio));
  if (index >= 0) solicitudes[index] = updated;
}

function renderSesion(sesion) {
  return `
    <dl class="exchange-session">
      <div><dt>Fecha</dt><dd>${formatearFechaHora(sesion.fecha_sesion)}</dd></div>
      <div><dt>Duracion</dt><dd>${Number(sesion.duracion_minutos || 60)} minutos</dd></div>
      <div><dt>Modalidad</dt><dd>${escapeHtml(sesion.modalidad || 'VIRTUAL')}</dd></div>
      <div><dt>Estado</dt><dd>${escapeHtml(sesion.estado || 'PROGRAMADA')}</dd></div>
      ${sesion.enlace_reunion ? `<div><dt>Enlace</dt><dd><a href="${escapeHtml(sesion.enlace_reunion)}" target="_blank" rel="noreferrer">Abrir reunion</a></dd></div>` : ''}
      ${sesion.lugar ? `<div><dt>Lugar</dt><dd>${escapeHtml(sesion.lugar)}</dd></div>` : ''}
    </dl>
  `;
}

export async function renderExchangesPage(container) {
  const user = getCurrentUser();
  if (!user?.id_usuario) {
    location.href = 'login.html';
    return;
  }

  container.innerHTML = renderShell(user);
  const listContainer = container.querySelector('.exchanges-list');
  const modal = container.querySelector('#exchangeCalendarModal');
  const modalBody = modal.querySelector('.exchange-modal__body');
  let solicitudes = [];

  function renderSolicitudes() {
    if (!solicitudes.length) {
      listContainer.innerHTML = renderEmpty();
      return;
    }

    listContainer.innerHTML = solicitudes.map(renderCard).join('');
  }

  async function cargarSolicitudes() {
    listContainer.innerHTML = renderLoading();
    const response = await obtenerSolicitudes(user.id_usuario);

    if (!response.success) {
      listContainer.innerHTML = `<div class="exchanges-error">${escapeHtml(response.message || response.error)}</div>`;
      return;
    }

    solicitudes = response.data || [];
    renderSolicitudes();
  }

  async function abrirCalendario(idIntercambio) {
    modal.hidden = false;
    modalBody.innerHTML = '<div class="exchanges-loading exchanges-loading--compact"><span></span><p>Cargando calendario...</p></div>';

    const response = await obtenerSesionIntercambio(user.id_usuario, idIntercambio);
    if (!response.success) {
      modalBody.innerHTML = `<div class="exchanges-error">${escapeHtml(response.message || response.error)}</div>`;
      return;
    }

    modalBody.innerHTML = renderSesion(response.data || {});
  }

  await cargarSolicitudes();

  listContainer.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;

    const id = button.dataset.id;
    const action = button.dataset.action;
    button.disabled = true;

    if (action === 'accept') {
      const response = await aceptarSolicitud(user.id_usuario, id);
      button.disabled = false;

      if (!response.success) {
        showFeedback(container, response.message || response.error, 'error');
        return;
      }

      updateSolicitud(solicitudes, response.data);
      renderSolicitudes();
      showFeedback(container, response.message);
    }

    if (action === 'reject') {
      if (!confirm('Deseas rechazar esta solicitud?')) {
        button.disabled = false;
        return;
      }

      const response = await rechazarSolicitud(user.id_usuario, id);
      button.disabled = false;

      if (!response.success) {
        showFeedback(container, response.message || response.error, 'error');
        return;
      }

      updateSolicitud(solicitudes, response.data);
      renderSolicitudes();
      showFeedback(container, response.message);
    }

    if (action === 'calendar') {
      button.disabled = false;
      abrirCalendario(id);
    }
  });

  modal.addEventListener('click', (event) => {
    if (event.target.closest('[data-action="close-modal"]')) {
      modal.hidden = true;
    }
  });

  container.querySelector('#logoutButton')?.addEventListener('click', () => {
    clearCurrentUser();
    location.href = 'login.html';
  });
}
