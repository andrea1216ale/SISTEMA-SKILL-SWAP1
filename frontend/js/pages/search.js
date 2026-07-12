import { getCurrentUser, clearCurrentUser } from '../common/auth.js';
import {
  closeSolicitarIntercambioModal,
  getSolicitarIntercambioPayload,
  openSolicitarIntercambioModal,
  renderSolicitarIntercambioModal,
  showSolicitarIntercambioFeedback
} from '../components/solicitar-intercambio.js';
import { searchPeople } from '../services/api.js';
import { solicitarIntercambio } from '../services/intercambio.service.js';
import { renderSidebar } from './dashboard.js';

const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  "'": '&#39;',
  '"': '&quot;'
}[character]));

const initial = (name = '?') => escapeHtml(name.trim().charAt(0).toUpperCase() || '?');

function resultRow(person, user, solicitudesEnviadas) {
  const description = person.descripcion || 'Disponible para compartir conocimientos y aprender en comunidad.';
  const puedeSolicitar = Number(person.id_usuario) !== Number(user.id_usuario);
  const solicitudKey = `${Number(person.id_usuario)}:${Number(person.id_habilidad)}`;
  const solicitudEnviada = solicitudesEnviadas.has(solicitudKey);
  const requestButton = puedeSolicitar
    ? `<button class="search-request-btn" type="button" data-action="request-swap" data-user-id="${Number(person.id_usuario)}" data-skill-id="${Number(person.id_habilidad)}" ${solicitudEnviada ? 'disabled' : ''}>${solicitudEnviada ? 'Solicitud enviada' : 'Solicitar intercambio'}</button>`
    : '';

  return `<article class="search-result" data-user-id="${Number(person.id_usuario)}">
    <div class="search-result__person">
      <span class="search-result__avatar">${initial(person.nombre)}</span>
      <div>
        <h2>${escapeHtml(person.nombre)}</h2>
        <p><span aria-hidden="true">*</span> ${Number(person.puntuacion || 0).toFixed(1)} <small>(${Number(person.total_calificaciones)} resenas)</small></p>
      </div>
    </div>
    <div class="search-result__skill">
      <span>${escapeHtml(person.categoria || 'General')}</span>
      <strong>${escapeHtml(person.habilidad)}</strong>
      <small>Nivel ${escapeHtml(person.nivel)}</small>
    </div>
    <p class="search-result__about">${escapeHtml(description)}</p>
    <div class="search-result__action">
      <span>${Number(person.intercambios)} intercambios</span>
      ${requestButton}
      <a href="profile.html?userId=${Number(person.id_usuario)}">Ver perfil <b aria-hidden="true">-&gt;</b></a>
    </div>
  </article>`;
}

function categoryOptions(categories, selected) {
  return ['<option value="">Todas las categorias</option>', ...categories.map((category) =>
    `<option value="${escapeHtml(category)}" ${category === selected ? 'selected' : ''}>${escapeHtml(category)}</option>`
  )].join('');
}

export async function renderSearchPage(container) {
  const user = getCurrentUser();
  if (!user?.id_usuario) {
    window.location.href = 'login.html';
    return;
  }

  const displayName = user.nombre || [user.nombres, user.apellido_paterno].filter(Boolean).join(' ') || 'Usuario';
  let state = { q: '', category: '', page: 1 };
  let currentResults = [];
  const solicitudesEnviadas = new Set();

  container.innerHTML = `<div class="dash-layout search-shell">
    ${renderSidebar({ nombre: displayName, correo: user.correo || '' }, 'search')}
    <main class="search-main">
      <header class="search-heading">
        <p>EXPLORA LA COMUNIDAD</p>
        <h1>Encuentra tu proximo intercambio</h1>
        <span>Busca una habilidad y conecta con alguien que pueda compartirla contigo.</span>
      </header>
      <form class="search-toolbar" id="searchForm" role="search">
        <label class="search-input">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
          <input id="searchQuery" maxlength="80" autocomplete="off" placeholder="Busca por habilidad, persona o categoria...">
        </label>
        <label class="search-select">
          <span class="sr-only">Categoria</span>
          <select id="searchCategory"><option value="">Todas las categorias</option></select>
        </label>
        <button type="submit">Buscar</button>
      </form>
      <div class="search-summary">
        <p id="searchCount">Buscando personas...</p>
        <button id="clearSearch" type="button" hidden>Limpiar filtros</button>
      </div>
      <section id="searchResults" class="search-results" aria-live="polite">
        <div class="search-status"><i></i><p>Cargando resultados...</p></div>
      </section>
      <nav id="searchPagination" class="search-pagination" aria-label="Paginas de resultados"></nav>
    </main>
    ${renderSolicitarIntercambioModal()}
  </div>`;

  container.querySelector('#logoutButton').addEventListener('click', () => {
    clearCurrentUser();
    window.location.href = 'login.html';
  });

  const form = container.querySelector('#searchForm');
  const queryInput = container.querySelector('#searchQuery');
  const categorySelect = container.querySelector('#searchCategory');
  const results = container.querySelector('#searchResults');
  const count = container.querySelector('#searchCount');
  const pagination = container.querySelector('#searchPagination');
  const clear = container.querySelector('#clearSearch');
  const modal = container.querySelector('#swapRequestModal');
  const requestForm = container.querySelector('#swapRequestForm');

  function renderResults() {
    results.innerHTML = currentResults.length
      ? currentResults.map((person) => resultRow(person, user, solicitudesEnviadas)).join('')
      : '<div class="search-status search-status--empty"><strong>No encontramos coincidencias</strong><p>Prueba otra habilidad o elimina alguno de los filtros.</p></div>';
  }

  async function load() {
    results.innerHTML = '<div class="search-status"><i></i><p>Buscando coincidencias...</p></div>';
    pagination.innerHTML = '';

    const data = await searchPeople({ userId: user.id_usuario, ...state });
    if (data.error) {
      results.innerHTML = `<div class="search-status search-status--error"><strong>No pudimos completar la busqueda</strong><p>${escapeHtml(data.error)}</p><button type="button" id="retrySearch">Intentar de nuevo</button></div>`;
      results.querySelector('#retrySearch').addEventListener('click', load);
      count.textContent = 'Busqueda no disponible';
      return;
    }

    categorySelect.innerHTML = categoryOptions(data.categories, state.category);
    clear.hidden = !state.q && !state.category;
    count.textContent = `${data.pagination.total} ${data.pagination.total === 1 ? 'resultado encontrado' : 'resultados encontrados'}`;
    currentResults = data.results || [];
    renderResults();

    if (data.pagination.pages > 1) {
      pagination.innerHTML = `<button type="button" data-page="${state.page - 1}" ${state.page === 1 ? 'disabled' : ''}>Anterior</button><span>Pagina ${state.page} de ${data.pagination.pages}</span><button type="button" data-page="${state.page + 1}" ${state.page === data.pagination.pages ? 'disabled' : ''}>Siguiente</button>`;
    }
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    state.q = queryInput.value.trim();
    state.category = categorySelect.value;
    state.page = 1;
    load();
  });

  categorySelect.addEventListener('change', () => {
    state.category = categorySelect.value;
    state.q = queryInput.value.trim();
    state.page = 1;
    load();
  });

  clear.addEventListener('click', () => {
    state = { q: '', category: '', page: 1 };
    queryInput.value = '';
    load();
  });

  pagination.addEventListener('click', (event) => {
    const button = event.target.closest('[data-page]');
    if (!button || button.disabled) return;
    state.page = Number(button.dataset.page);
    load();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  results.addEventListener('click', (event) => {
    const interactive = event.target.closest('button, a[href]');
    if (interactive) {
      if (interactive.matches('[data-action="request-swap"]') && !interactive.disabled) {
        const person = currentResults.find((item) =>
          Number(item.id_usuario) === Number(interactive.dataset.userId)
          && Number(item.id_habilidad) === Number(interactive.dataset.skillId)
        );
        if (person) openSolicitarIntercambioModal(container, person);
      }
      return;
    }

    const article = event.target.closest('[data-user-id]');
    if (article) {
      window.location.href = `profile.html?userId=${article.dataset.userId}`;
    }
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

    solicitudesEnviadas.add(`${Number(payload.idUsuarioRecibe)}:${Number(payload.idHabilidad)}`);
    showSolicitarIntercambioFeedback(container, response.message || 'Solicitud enviada correctamente');
    renderResults();
    window.setTimeout(() => closeSolicitarIntercambioModal(container), 900);
  });

  load();
}
