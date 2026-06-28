import { getCurrentUser, clearCurrentUser } from '../common/auth.js';
import { getProfile, updateProfile } from '../services/api.js';
import { renderSidebar } from './dashboard.js';

const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
const fullName = (profile) => [profile.nombres, profile.apellido_paterno, profile.apellido_materno].filter(Boolean).join(' ');

function skillItems(skills, emptyText) {
  return skills.length
    ? skills.map((skill) => `<li><strong>${escapeHtml(skill.nombre)}</strong><span>${escapeHtml(skill.categoria || 'Sin categoría')}</span></li>`).join('')
    : `<li class="profile-skill-empty">${emptyText}</li>`;
}

function skillOptions(skills, selected, type) {
  const selectedIds = new Set(selected.map((skill) => Number(skill.id_habilidad)));
  return skills.map((skill) => `
    <label class="profile-skill-option">
      <input type="checkbox" name="${type}" value="${Number(skill.id_habilidad)}" ${selectedIds.has(Number(skill.id_habilidad)) ? 'checked' : ''}>
      <span><strong>${escapeHtml(skill.nombre)}</strong><small>${escapeHtml(skill.categoria || 'Sin categoría')}</small></span>
    </label>`).join('');
}

function renderContent(profile) {
  const name = fullName(profile);
  return `
    <div class="dash-layout profile-shell">
      ${renderSidebar({ nombre: name, correo: profile.correo }, 'profile')}
      <main class="profile-main">
        <section class="profile-hero profile-card">
          <div class="profile-avatar" aria-hidden="true">${escapeHtml(name.charAt(0).toUpperCase())}</div>
          <div class="profile-identity"><p>MI PERFIL</p><h1>${escapeHtml(name)}</h1><span>${escapeHtml(profile.correo)}</span>
            <div class="profile-stats"><strong>★ ${Number(profile.puntuacion || 0).toFixed(1)}</strong><span>•</span><span>${Number(profile.total_intercambios || 0)} intercambios</span></div>
          </div>
          <button type="button" id="editProfile">✎ Editar perfil</button>
        </section>

        <section id="profileView">
          <article class="profile-card profile-about">
            <p>SOBRE MÍ</p><h2>Acerca de mí</h2>
            <p class="profile-description ${profile.descripcion ? '' : 'is-empty'}">${escapeHtml(profile.descripcion || 'Todavía no has agregado una descripción. Cuéntale a la comunidad un poco sobre ti.')}</p>
          </article>
          <div class="profile-skills-grid">
            <article class="profile-card profile-skills profile-skills--offer"><p>LO QUE COMPARTO</p><h2>Habilidades que ofrezco</h2><ul>${skillItems(profile.habilidadesOfrece, 'Aún no has seleccionado habilidades para ofrecer.')}</ul></article>
            <article class="profile-card profile-skills profile-skills--want"><p>MIS PRÓXIMOS RETOS</p><h2>Quiero aprender</h2><ul>${skillItems(profile.habilidadesBusca, 'Aún no has seleccionado qué quieres aprender.')}</ul></article>
          </div>
        </section>

        <form id="profileForm" class="profile-card profile-editor" hidden>
          <header><div><p>EDITAR PERFIL</p><h2>Actualiza cómo te presentas</h2></div><button type="button" class="secondary" id="cancelProfile">Cancelar</button></header>
          <label class="profile-description-field" for="descriptionInput">Descripción
            <textarea id="descriptionInput" maxlength="500" rows="6" placeholder="Cuéntanos qué te gusta enseñar y aprender…">${escapeHtml(profile.descripcion || '')}</textarea>
          </label>
          <div class="profile-form-meta"><span id="characterCount">${String(profile.descripcion || '').length}/500</span><span id="formMessage" role="status"></span></div>
          <div class="profile-picker-grid">
            <fieldset><legend>Habilidades que ofrezco</legend><p>Selecciona lo que puedes compartir.</p><div class="profile-options">${skillOptions(profile.habilidadesDisponibles, profile.habilidadesOfrece, 'ofrece')}</div></fieldset>
            <fieldset><legend>Quiero aprender</legend><p>Selecciona lo que estás buscando.</p><div class="profile-options">${skillOptions(profile.habilidadesDisponibles, profile.habilidadesBusca, 'busca')}</div></fieldset>
          </div>
          <div class="profile-actions"><button type="button" class="secondary" id="cancelProfileBottom">Cancelar</button><button type="submit" id="saveProfile">Guardar cambios</button></div>
        </form>
      </main>
    </div>`;
}

function selectedIds(form, name) {
  return [...form.querySelectorAll(`input[name="${name}"]:checked`)].map((input) => Number(input.value));
}

export async function renderProfilePage(container) {
  const currentUser = getCurrentUser();
  if (!currentUser?.id_usuario) {
    window.location.href = 'login.html';
    return;
  }

  container.innerHTML = '<div class="profile-loading"><span></span><p>Cargando tu perfil…</p></div>';
  const profile = await getProfile(currentUser.id_usuario);
  if (profile.error) {
    container.innerHTML = `<div class="profile-error"><h1>No pudimos cargar tu perfil</h1><p>${escapeHtml(profile.error)}</p><a href="dashboard.html">Volver al panel</a></div>`;
    return;
  }

  container.innerHTML = renderContent(profile);
  container.querySelector('#logoutButton').addEventListener('click', () => {
    clearCurrentUser();
    window.location.href = 'login.html';
  });

  const view = container.querySelector('#profileView');
  const form = container.querySelector('#profileForm');
  const input = container.querySelector('#descriptionInput');
  const count = container.querySelector('#characterCount');
  const message = container.querySelector('#formMessage');
  const saveButton = container.querySelector('#saveProfile');
  const openEditor = () => { view.hidden = true; form.hidden = false; input.focus(); };
  const closeEditor = () => { form.hidden = true; view.hidden = false; };

  container.querySelector('#editProfile').addEventListener('click', openEditor);
  container.querySelector('#cancelProfile').addEventListener('click', closeEditor);
  container.querySelector('#cancelProfileBottom').addEventListener('click', closeEditor);
  input.addEventListener('input', () => { count.textContent = `${input.value.length}/500`; });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    saveButton.disabled = true;
    saveButton.textContent = 'Guardando…';
    message.textContent = '';
    message.className = '';
    const result = await updateProfile(currentUser.id_usuario, {
      descripcion: input.value,
      habilidadesOfrece: selectedIds(form, 'ofrece'),
      habilidadesBusca: selectedIds(form, 'busca')
    });
    if (result.error) {
      saveButton.disabled = false;
      saveButton.textContent = 'Guardar cambios';
      message.textContent = result.error;
      message.className = 'is-error';
      return;
    }
    await renderProfilePage(container);
  });
}
