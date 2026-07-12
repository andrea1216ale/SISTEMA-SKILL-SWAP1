import { getCurrentUser, clearCurrentUser } from '../common/auth.js';
import {
  closeSolicitarIntercambioModal,
  getSolicitarIntercambioPayload,
  openSolicitarIntercambioModal,
  renderSolicitarIntercambioModal,
  showSolicitarIntercambioFeedback
} from '../components/solicitar-intercambio.js';
import { crearCalificacion, obtenerCalificaciones, obtenerCalificacionesUsuario } from '../services/api.js';
import { solicitarIntercambio } from '../services/intercambio.service.js';
import { renderSidebar } from './dashboard.js';

const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  "'": '&#39;',
  '"': '&quot;'
}[character]));

const initial = (value = '?') => escapeHtml(String(value).trim().charAt(0).toUpperCase() || '?');

function fecha(fechaCalificacion) {
  if (!fechaCalificacion) return 'Sin fecha';
  return new Date(fechaCalificacion).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function renderStars(score) {
  const rating = Math.max(0, Math.min(5, Math.round(Number(score || 0))));
  return Array.from({ length: 5 }, (_, index) => index < rating ? '*' : '-').join('');
}

function primarySkill(item) {
  if (item.id_habilidad) return { id_habilidad: item.id_habilidad, nombre: item.habilidad };
  return item.habilidades?.[0] || null;
}

function renderCalificarModal() {
  return `<div class="rating-modal" id="ratingModal" hidden>
    <div class="rating-modal__backdrop" data-rating-close></div>
    <section class="rating-modal__panel" role="dialog" aria-modal="true" aria-labelledby="ratingModalTitle">
      <header>
        <div>
          <p>Calificacion</p>
          <h2 id="ratingModalTitle">Valorar intercambio</h2>
        </div>
        <button type="button" class="rating-modal__close" data-rating-close aria-label="Cerrar">x</button>
      </header>
      <form id="ratingForm" class="rating-form">
        <input type="hidden" id="ratingExchangeId">
        <input type="hidden" id="ratingUserId">
        <label>
          <span>Usuario</span>
          <input id="ratingUserName" type="text" disabled>
        </label>
        <label>
          <span>Puntuacion</span>
          <select id="ratingScore" required>
            <option value="5">5 - Excelente</option>
            <option value="4">4 - Muy bueno</option>
            <option value="3">3 - Bueno</option>
            <option value="2">2 - Regular</option>
            <option value="1">1 - Necesita mejorar</option>
          </select>
        </label>
        <label>
          <span>Comentario</span>
          <textarea id="ratingComment" maxlength="1000" rows="4" placeholder="Cuenta como fue la experiencia de aprendizaje."></textarea>
        </label>
        <div class="rating-form__feedback" role="status" aria-live="polite" hidden></div>
        <div class="rating-form__actions">
          <button type="button" class="rating-action rating-action--secondary" data-rating-close>Cancelar</button>
          <button type="submit" class="rating-action rating-action--primary">Guardar calificacion</button>
        </div>
      </form>
    </section>
  </div>`;
}

function openRatingModal(container, item) {
  const modal = container.querySelector('#ratingModal');
  const form = container.querySelector('#ratingForm');
  const feedback = container.querySelector('.rating-form__feedback');
  const evaluatedUserId = Number(item.usuario_evaluado || item.id_usuario);

  modal.hidden = false;
  form.reset();
  feedback.hidden = true;
  feedback.textContent = '';
  feedback.className = 'rating-form__feedback';
  form.querySelector('#ratingExchangeId').value = Number(item.id_intercambio_calificable);
  form.querySelector('#ratingUserId').value = evaluatedUserId;
  form.querySelector('#ratingUserName').value = item.evaluado_nombre || item.nombre || 'Usuario';
  form.querySelector('#ratingScore').focus();
}

function closeRatingModal(container) {
  const modal = container.querySelector('#ratingModal');
  if (modal) modal.hidden = true;
}

function showRatingFeedback(container, message, type = 'success') {
  const feedback = container.querySelector('.rating-form__feedback');
  feedback.textContent = message;
  feedback.className = `rating-form__feedback rating-form__feedback--${type}`;
  feedback.hidden = false;
}

function renderCard(item, currentUserId, sentRequests) {
  const skill = primarySkill(item);
  const evaluatedUserId = Number(item.usuario_evaluado || item.id_usuario);
  const evaluatedName = item.evaluado_nombre || item.nombre || 'Usuario';
  const score = item.puntuacion ?? item.promedio ?? 0;
  const isCurrentUser = evaluatedUserId === Number(currentUserId);
  const key = `${evaluatedUserId}:${Number(skill?.id_habilidad || 0)}`;
  const alreadySent = sentRequests.has(key);
  const canRate = !isCurrentUser && Number(item.id_intercambio_calificable) > 0;
  const alreadyRated = Number(item.ya_calificado_por_mi || 0) === 1;
  const hasConversation = Number(item.han_chateado || 0) === 1;
  const canRequest = false;
  const rateLabel = isCurrentUser
    ? 'Tu perfil'
    : alreadyRated
      ? 'Ya calificaste'
      : hasConversation
        ? 'Sin calificacion pendiente'
        : 'Sin conversacion';
  const disabledReason = isCurrentUser
    ? 'Es tu calificacion'
    : alreadyRated
      ? 'Ya calificaste'
      : hasConversation
        ? 'Ya existe conversacion'
      : !skill?.id_habilidad
      ? 'Sin habilidad disponible'
      : 'No disponible';

  return `<article class="rating-card" data-user-id="${evaluatedUserId}">
    <div class="rating-card__identity">
      <span class="rating-avatar">${initial(evaluatedName)}</span>
      <div class="rating-card__name">
        <h2>${escapeHtml(evaluatedName)}</h2>
        <p>${skill ? escapeHtml(skill.nombre) : 'Habilidad no registrada'}</p>
      </div>
      ${isCurrentUser ? '<span class="rating-pill">Tu perfil</span>' : ''}
    </div>
    <div class="rating-card__meta">
      <div class="rating-score" aria-label="${Number(score || 0).toFixed(1)} de 5">
        <strong>${Number(score || 0).toFixed(1)}</strong>
        <span>${renderStars(score)}</span>
      </div>
      <small>${Number(item.total_calificaciones || 0)} reseñas</small>
    </div>
    <p class="rating-comment">${escapeHtml(item.comentario || item.descripcion || 'Sin descripcion disponible.')}</p>
    <div class="rating-actions">
      ${canRate
        ? `<button type="button" class="rating-request rating-request--rate" data-action="rate-user" data-user-id="${evaluatedUserId}">Calificar</button>`
        : `<button type="button" class="rating-request rating-request--rate" disabled>${rateLabel}</button>`}
      ${canRequest
        ? `<button type="button" class="rating-request" data-action="request-swap" data-user-id="${evaluatedUserId}" data-skill-id="${Number(skill.id_habilidad)}" ${alreadySent ? 'disabled' : ''}>${alreadySent ? 'Solicitud enviada' : 'Solicitar intercambio'}</button>`
        : ''}
    </div>
  </article>`;
}

function renderMiniReview(review) {
  return `<article class="rating-review">
    <header><strong>${escapeHtml(review.usuario_calificador?.nombre || 'Usuario')}</strong><span>${fecha(review.fecha)}</span></header>
    <div class="rating-review__score"><b>${Number(review.puntuacion || 0).toFixed(1)}</b><span>${renderStars(review.puntuacion)}</span></div>
    <p>${escapeHtml(review.comentario || 'Sin comentario escrito.')}</p>
  </article>`;
}

function renderOwnSummary(summarySource, ownReviews) {
  const summary = summarySource || {};
  return `<section class="ratings-overview">
    <div class="ratings-overview__score">
      <p>Tu reputacion</p>
      <strong>${Number(summary.promedio || 0).toFixed(1)}</strong>
      <span>${Number(summary.total_calificaciones || 0)} reseñas recibidas</span>
    </div>
    <div class="ratings-overview__reviews">
      <header>
        <div>
          <p>Reseñas recientes</p>
          <h2>Lo que otros dicen de ti</h2>
        </div>
        <a href="profile.html">Ver perfil</a>
      </header>
      <div class="ratings-review-list">
        ${ownReviews.length ? ownReviews.slice(0, 3).map(renderMiniReview).join('') : '<div class="ratings-empty-inline">Aun no tienes reseñas recibidas.</div>'}
      </div>
    </div>
  </section>`;
}

function renderSection(title, eyebrow, description, items, renderer, emptyText, modifier = '', controls = '') {
  return `<section class="ratings-section ${modifier}">
    <header class="ratings-section__head">
      <div>
        <p>${escapeHtml(eyebrow)}</p>
        <h2>${escapeHtml(title)}</h2>
        <span>${escapeHtml(description)}</span>
      </div>
      ${controls}
    </header>
    <div class="ratings-list">
      ${items.length ? items.map(renderer).join('') : `<div class="ratings-empty-inline">${escapeHtml(emptyText)}</div>`}
    </div>
  </section>`;
}

function renderRatingFilters(active) {
  const options = [
    ['all', 'Todas'],
    ['pending', 'Por calificar'],
    ['rated', 'Calificadas']
  ];

  return `<div class="ratings-filter" role="group" aria-label="Filtrar interacciones">
    ${options.map(([value, label]) =>
      `<button type="button" data-filter="${value}" class="${active === value ? 'is-active' : ''}">${label}</button>`
    ).join('')}
  </div>`;
}

function renderMetricStrip({ ownSummary, pendingCount, communityCount }) {
  return `<section class="ratings-metrics" aria-label="Resumen de reseñas">
    <article><span>Promedio recibido</span><strong>${Number(ownSummary?.promedio || 0).toFixed(1)}</strong></article>
    <article><span>Reseñas recibidas</span><strong>${Number(ownSummary?.total_calificaciones || 0)}</strong></article>
    <article><span>Pendientes por calificar</span><strong>${pendingCount}</strong></article>
    <article><span>Conversaciones listadas</span><strong>${communityCount}</strong></article>
  </section>`;
}

export async function renderRatingsPage(container) {
  const user = getCurrentUser();
  if (!user?.id_usuario) {
    window.location.href = 'login.html';
    return;
  }

  const displayName = user.nombre || [user.nombres, user.apellido_paterno].filter(Boolean).join(' ') || 'Usuario';
  const sentRequests = new Set();
  let ratings = [];
  let ownReviewsData = null;
  let ratingFilter = 'all';

  container.innerHTML = `<div class="dash-layout ratings-shell">
    ${renderSidebar({ nombre: displayName, correo: user.correo || '' }, 'ratings')}
    <main class="ratings-main">
      <header class="ratings-heading">
        <div>
          <p>Calificaciones</p>
          <h1>Reseñas</h1>
          <span>Gestiona tu reputacion, revisa comentarios recibidos y califica conversaciones pendientes.</span>
        </div>
      </header>
      <div class="ratings-content" aria-live="polite">
        <div class="ratings-status"><i></i><p>Cargando calificaciones...</p></div>
      </div>
    </main>
    ${renderSolicitarIntercambioModal()}
    ${renderCalificarModal()}
  </div>`;

  const list = container.querySelector('.ratings-content');
  const modal = container.querySelector('#swapRequestModal');
  const requestForm = container.querySelector('#swapRequestForm');
  const ratingModal = container.querySelector('#ratingModal');
  const ratingForm = container.querySelector('#ratingForm');

  function renderRatings() {
    const ownUser = ratings.find((item) => Number(item.id_usuario) === Number(user.id_usuario));
    const interactions = ratings.filter((item) =>
      Number(item.id_usuario) !== Number(user.id_usuario)
      && Number(item.han_chateado || 0) === 1
    );
    const pending = interactions.filter((item) => Number(item.id_intercambio_calificable) > 0);
    const rated = interactions.filter((item) => Number(item.ya_calificado_por_mi || 0) === 1);
    const filteredInteractions = ratingFilter === 'pending'
      ? pending
      : ratingFilter === 'rated'
        ? rated
        : interactions;
    const ownReviews = ownReviewsData?.calificaciones || [];
    const ownSummary = ownReviewsData?.resumen || ownUser;

    list.innerHTML = [
      renderMetricStrip({ ownSummary, pendingCount: pending.length, communityCount: interactions.length }),
      renderOwnSummary(ownSummary, ownReviews),
      renderSection(
        'Conversaciones',
        'Historial conversado',
        'Usuarios con quienes ya tuviste una conversacion dentro de un intercambio.',
        filteredInteractions,
        (item) => renderCard(item, user.id_usuario, sentRequests),
        ratingFilter === 'pending'
          ? 'No tienes usuarios pendientes por calificar.'
          : ratingFilter === 'rated'
            ? 'Aun no has calificado a ningun usuario.'
            : 'Aun no tienes conversaciones para mostrar.',
        'ratings-section--community',
        renderRatingFilters(ratingFilter)
      )
    ].join('');
  }

  async function load() {
    list.innerHTML = '<div class="ratings-status"><i></i><p>Cargando calificaciones...</p></div>';
    const [response, ownResponse] = await Promise.all([
      obtenerCalificaciones(user.id_usuario),
      obtenerCalificacionesUsuario(user.id_usuario, user.id_usuario)
    ]);

    if (!response.success) {
      list.innerHTML = `<div class="ratings-status ratings-status--error"><strong>No pudimos cargar las calificaciones</strong><p>${escapeHtml(response.message || response.error)}</p><button type="button" id="retryRatings">Intentar de nuevo</button></div>`;
      list.querySelector('#retryRatings')?.addEventListener('click', load);
      return;
    }

    ratings = response.data || [];
    ownReviewsData = ownResponse.success ? ownResponse.data : null;
    renderRatings();
  }

  list.addEventListener('click', (event) => {
    const interactive = event.target.closest('button, a[href]');
    if (interactive) {
      if (interactive.matches('[data-action="rate-user"]') && !interactive.disabled) {
        const rating = ratings.find((item) =>
          Number(item.usuario_evaluado || item.id_usuario) === Number(interactive.dataset.userId)
        );
        if (rating?.id_intercambio_calificable) openRatingModal(container, rating);
        return;
      }

      if (interactive.matches('[data-action="request-swap"]') && !interactive.disabled) {
        const rating = ratings.find((item) =>
          Number(item.usuario_evaluado || item.id_usuario) === Number(interactive.dataset.userId)
          && Number(primarySkill(item)?.id_habilidad) === Number(interactive.dataset.skillId)
        );
        const skill = primarySkill(rating || {});
        if (!rating || !skill) return;
        openSolicitarIntercambioModal(container, {
          id_usuario: rating.usuario_evaluado || rating.id_usuario,
          id_habilidad: skill.id_habilidad,
          nombre: rating.evaluado_nombre || rating.nombre,
          habilidad: skill.nombre
        });
      }
      return;
    }

    const article = event.target.closest('[data-user-id]');
    if (article) {
      window.location.href = `profile.html?userId=${article.dataset.userId}`;
    }
  });

  list.addEventListener('click', (event) => {
    const filterButton = event.target.closest('[data-filter]');
    if (!filterButton) return;
    ratingFilter = filterButton.dataset.filter;
    renderRatings();
  });

  modal.addEventListener('click', (event) => {
    if (event.target.closest('[data-swap-close]')) {
      closeSolicitarIntercambioModal(container);
    }
  });

  requestForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = requestForm.querySelector('button[type="submit"]');
    const payload = getSolicitarIntercambioPayload(container);
    submitButton.disabled = true;

    const response = await solicitarIntercambio(user.id_usuario, payload);
    submitButton.disabled = false;

    if (!response.success) {
      showSolicitarIntercambioFeedback(container, response.message || response.error, 'error');
      return;
    }

    sentRequests.add(`${Number(payload.idUsuarioRecibe)}:${Number(payload.idHabilidad)}`);
    showSolicitarIntercambioFeedback(container, response.message || 'Solicitud enviada correctamente.');
    renderRatings();
    window.setTimeout(() => closeSolicitarIntercambioModal(container), 900);
  });

  ratingModal.addEventListener('click', (event) => {
    if (event.target.closest('[data-rating-close]')) {
      closeRatingModal(container);
    }
  });

  ratingForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = ratingForm.querySelector('button[type="submit"]');
    const payload = {
      id_intercambio: Number(ratingForm.querySelector('#ratingExchangeId').value),
      usuario_evaluado: Number(ratingForm.querySelector('#ratingUserId').value),
      puntuacion: Number(ratingForm.querySelector('#ratingScore').value),
      comentario: ratingForm.querySelector('#ratingComment').value.trim()
    };

    submitButton.disabled = true;
    const response = await crearCalificacion(user.id_usuario, payload);
    submitButton.disabled = false;

    if (!response.success) {
      showRatingFeedback(container, response.message || response.error, 'error');
      return;
    }

    showRatingFeedback(container, response.message || 'Calificacion guardada correctamente.');
    await load();
    window.setTimeout(() => closeRatingModal(container), 900);
  });

  container.querySelector('#logoutButton')?.addEventListener('click', () => {
    clearCurrentUser();
    window.location.href = 'login.html';
  });

  await load();
}
