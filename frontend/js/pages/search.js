import { getCurrentUser, clearCurrentUser } from '../common/auth.js';
import { searchPeople } from '../services/api.js';
import { renderSidebar } from './dashboard.js';

const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
const initial = (name = '?') => escapeHtml(name.trim().charAt(0).toUpperCase() || '?');

function resultRow(person) {
  const description = person.descripcion || 'Disponible para compartir conocimientos y aprender en comunidad.';
  return `<article class="search-result">
    <div class="search-result__person">
      <span class="search-result__avatar">${initial(person.nombre)}</span>
      <div><h2>${escapeHtml(person.nombre)}</h2><p><span aria-hidden="true">★</span> ${Number(person.puntuacion || 0).toFixed(1)} <small>(${Number(person.total_calificaciones)} reseñas)</small></p></div>
    </div>
    <div class="search-result__skill"><span>${escapeHtml(person.categoria || 'General')}</span><strong>${escapeHtml(person.habilidad)}</strong><small>Nivel ${escapeHtml(person.nivel)}</small></div>
    <p class="search-result__about">${escapeHtml(description)}</p>
    <div class="search-result__action"><span>${Number(person.intercambios)} intercambios</span><a href="profile.html?userId=${Number(person.id_usuario)}">Ver perfil <b aria-hidden="true">→</b></a></div>
  </article>`;
}

function categoryOptions(categories, selected) {
  return ['<option value="">Todas las categorías</option>', ...categories.map((category) =>
    `<option value="${escapeHtml(category)}" ${category === selected ? 'selected' : ''}>${escapeHtml(category)}</option>`
  )].join('');
}

export async function renderSearchPage(container) {
  const user = getCurrentUser();
  if (!user?.id_usuario) { window.location.href = 'login.html'; return; }
  const displayName = user.nombre || [user.nombres, user.apellido_paterno].filter(Boolean).join(' ') || 'Usuario';
  let state = { q: '', category: '', page: 1 };
  container.innerHTML = `<div class="dash-layout search-shell">
    ${renderSidebar({ nombre: displayName, correo: user.correo || '' }, 'search')}
    <main class="search-main">
      <header class="search-heading"><p>EXPLORA LA COMUNIDAD</p><h1>Encuentra tu próximo intercambio</h1><span>Busca una habilidad y conecta con alguien que pueda compartirla contigo.</span></header>
      <form class="search-toolbar" id="searchForm" role="search">
        <label class="search-input"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input id="searchQuery" maxlength="80" autocomplete="off" placeholder="Busca por habilidad, persona o categoría…"></label>
        <label class="search-select"><span class="sr-only">Categoría</span><select id="searchCategory"><option value="">Todas las categorías</option></select></label>
        <button type="submit">Buscar</button>
      </form>
      <div class="search-summary"><p id="searchCount">Buscando personas…</p><button id="clearSearch" type="button" hidden>Limpiar filtros</button></div>
      <section id="searchResults" class="search-results" aria-live="polite"><div class="search-status"><i></i><p>Cargando resultados…</p></div></section>
      <nav id="searchPagination" class="search-pagination" aria-label="Páginas de resultados"></nav>
    </main>
  </div>`;

  container.querySelector('#logoutButton').addEventListener('click', () => { clearCurrentUser(); window.location.href = 'login.html'; });
  const form = container.querySelector('#searchForm');
  const queryInput = container.querySelector('#searchQuery');
  const categorySelect = container.querySelector('#searchCategory');
  const results = container.querySelector('#searchResults');
  const count = container.querySelector('#searchCount');
  const pagination = container.querySelector('#searchPagination');
  const clear = container.querySelector('#clearSearch');

  async function load() {
    results.innerHTML = '<div class="search-status"><i></i><p>Buscando coincidencias…</p></div>';
    pagination.innerHTML = '';
    const data = await searchPeople({ userId: user.id_usuario, ...state });
    if (data.error) {
      results.innerHTML = `<div class="search-status search-status--error"><strong>No pudimos completar la búsqueda</strong><p>${escapeHtml(data.error)}</p><button type="button" id="retrySearch">Intentar de nuevo</button></div>`;
      results.querySelector('#retrySearch').addEventListener('click', load);
      count.textContent = 'Búsqueda no disponible';
      return;
    }
    categorySelect.innerHTML = categoryOptions(data.categories, state.category);
    clear.hidden = !state.q && !state.category;
    count.textContent = `${data.pagination.total} ${data.pagination.total === 1 ? 'resultado encontrado' : 'resultados encontrados'}`;
    results.innerHTML = data.results.length ? data.results.map(resultRow).join('') : '<div class="search-status search-status--empty"><strong>No encontramos coincidencias</strong><p>Prueba otra habilidad o elimina alguno de los filtros.</p></div>';
    if (data.pagination.pages > 1) {
      pagination.innerHTML = `<button type="button" data-page="${state.page - 1}" ${state.page === 1 ? 'disabled' : ''}>← Anterior</button><span>Página ${state.page} de ${data.pagination.pages}</span><button type="button" data-page="${state.page + 1}" ${state.page === data.pagination.pages ? 'disabled' : ''}>Siguiente →</button>`;
    }
  }

  form.addEventListener('submit', (event) => { event.preventDefault(); state.q = queryInput.value.trim(); state.category = categorySelect.value; state.page = 1; load(); });
  categorySelect.addEventListener('change', () => { state.category = categorySelect.value; state.q = queryInput.value.trim(); state.page = 1; load(); });
  clear.addEventListener('click', () => { state = { q: '', category: '', page: 1 }; queryInput.value = ''; load(); });
  pagination.addEventListener('click', (event) => { const button = event.target.closest('[data-page]'); if (!button || button.disabled) return; state.page = Number(button.dataset.page); load(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
  load();
}
