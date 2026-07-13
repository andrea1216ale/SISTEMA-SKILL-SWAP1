import { getCurrentUser, clearCurrentUser } from '../common/auth.js';
import { getFeed, getFeedSkills, createPost, getComments, addComment, reactToPost, toggleSavedPost } from '../services/api.js';
import { renderSidebar } from './dashboard.js';

const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[char]));
const initial = (value = '?') => escapeHtml(value.trim().charAt(0).toUpperCase() || '?');
const labels = { OFREZCO:'Ofrezco', BUSCO:'Busco', CONSULTA:'Consulta', RECURSO:'Recurso', LOGRO:'Logro', PRINCIPIANTE:'Principiante', INTERMEDIO:'Intermedio', AVANZADO:'Avanzado' };

function relativeDate(date) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 1000));
  const ranges = [[31536000,'año'],[2592000,'mes'],[86400,'día'],[3600,'hora'],[60,'minuto']];
  for (const [size, unit] of ranges) if (seconds >= size) { const amount=Math.floor(seconds/size); return `Hace ${amount} ${unit}${amount===1?'':'s'}`; }
  return 'Hace un momento';
}
function toast(message, error=false) { const node=document.createElement('div'); node.className=`feed-toast${error?' is-error':''}`; node.textContent=message; document.body.append(node); setTimeout(()=>node.remove(),2800); }

function renderComments(comments) {
  if (!comments.length) return '<p class="feed-comments__status">Todavía no hay comentarios. Sé la primera persona en comentar.</p>';
  return comments.map(comment => `<div class="feed-comment"><span class="feed-avatar">${initial(comment.usuario_nombre)}</span><div><strong>${escapeHtml(comment.usuario_nombre)}</strong><p>${escapeHtml(comment.comentario)}</p><small>${relativeDate(comment.fecha_comentario)}</small></div></div>`).join('');
}

function renderCard(post, userId) {
  const reactionType = ['OFREZCO','BUSCO'].includes(post.tipo) ? 'ME_INTERESA' : 'LIKE';
  const reactionLabel = reactionType === 'ME_INTERESA' ? 'Me interesa' : 'Me gusta';
  const activeReactionLabel = reactionType === 'ME_INTERESA' ? 'Te interesa' : 'Te gusta';
  const reactionActive = post.mi_reaccion === reactionType;
  const tags = post.habilidades.map(skill => `<span class="feed-tag">${escapeHtml(skill.nombre)}</span>`).join('');
  const files = post.archivos.map(file => file.tipo === 'IMAGEN' ? `<img class="feed-image" src="${escapeHtml(file.url_archivo)}" alt="Archivo de ${escapeHtml(post.titulo)}" loading="lazy">` : `<a class="feed-file" href="${escapeHtml(file.url_archivo)}" target="_blank" rel="noopener">📎 ${file.tipo === 'CERTIFICADO' ? 'Ver certificado' : 'Ver documento'}</a>`).join('');
  return `<article class="feed-card" data-post-id="${post.id_publicacion}">
    <header class="feed-card__head"><span class="feed-avatar">${initial(post.usuario_nombre)}</span><div class="feed-card__user"><strong>${escapeHtml(post.usuario_nombre)}</strong><span>★ ${Number(post.usuario_puntuacion||0).toFixed(1)} · ${Number(post.usuario_intercambios)} intercambios · ${relativeDate(post.fecha_creacion)}</span></div><span class="feed-badge">${labels[post.tipo]}</span></header>
    <h2>${escapeHtml(post.titulo)}</h2><p class="feed-card__description">${escapeHtml(post.descripcion)}</p>
    ${tags ? `<div class="feed-tags">${tags}</div>` : ''}<div class="feed-details">${post.nivel?`<span>📈 ${labels[post.nivel]}</span>`:''}${post.disponibilidad?`<span>🕒 ${escapeHtml(post.disponibilidad)}</span>`:''}</div>${files}
    <div class="feed-counts"><span data-reaction-count>${Number(post.total_reacciones)} reacciones</span> · <span data-comment-count>${Number(post.total_comentarios)} comentarios</span></div>
    <div class="feed-actions"><button class="feed-action ${reactionActive?'is-active':''}" data-action="react" data-reaction="${reactionType}" data-label="${reactionLabel}" data-active-label="${activeReactionLabel}" aria-pressed="${reactionActive}">${reactionActive?'♥':'♡'} ${reactionActive?activeReactionLabel:reactionLabel}</button><button class="feed-action" data-action="comments" aria-expanded="false">💬 Ver comentarios</button><button class="feed-action ${post.guardada?'is-active':''}" data-action="save">🔖 ${post.guardada?'Guardado':'Guardar'}</button><a class="feed-action" href="exchanges.html?usuario=${post.id_usuario}&publicacion=${post.id_publicacion}">↔ Solicitar intercambio</a></div>
    <section class="feed-comments"><div data-comments-list></div><form class="feed-comment-form"><input name="comentario" maxlength="1000" required placeholder="Escribe un comentario…"><button>Enviar</button></form></section>
  </article>`;
}

function shell(user) {
  return `<div class="dash-layout">${renderSidebar(user,'feed')}<main class="feed-main"><div class="feed-shell">
    <header class="feed-title"><p>Comunidad de aprendizaje</p><h1>Comparte, aprende y conecta</h1><span>Descubre experiencias, recursos y personas con quienes intercambiar habilidades.</span></header>
    <section class="feed-composer"><span class="feed-avatar">${initial(user.nombre || user.nombres)}</span><button type="button" data-open-modal>¿Qué quieres compartir hoy?</button><button type="button" class="feed-primary" data-open-modal>Publicar</button></section>
    <nav class="feed-filters" aria-label="Filtrar publicaciones">${[['','Todos'],['OFREZCO','Ofrezco'],['BUSCO','Busco'],['CONSULTA','Consulta'],['RECURSO','Recurso'],['LOGRO','Logro']].map(([value,label],i)=>`<button class="feed-filter ${i===0?'is-active':''}" data-type="${value}">${label}</button>`).join('')}<select class="feed-select" id="skillFilter"><option value="">Todas las habilidades</option></select></nav>
    <div class="feed-list"><div class="feed-empty">Cargando publicaciones…</div></div>
  </div></main></div>
  <div class="feed-modal" hidden><div class="feed-modal__panel" role="dialog" aria-modal="true" aria-labelledby="postFormTitle"><header class="feed-modal__head"><h2 id="postFormTitle">Crear publicación</h2><button class="feed-close" type="button" aria-label="Cerrar">×</button></header>
  <form class="feed-form"><div class="feed-field"><label for="postType">Tipo *</label><select id="postType" name="tipo" required><option value="OFREZCO">Ofrezco enseñar</option><option value="BUSCO">Busco aprender</option><option value="CONSULTA">Consulta</option><option value="RECURSO">Recurso</option><option value="LOGRO">Logro</option></select></div><div class="feed-field"><label for="postLevel">Nivel</label><select id="postLevel" name="nivel"><option value="">No aplica</option><option>PRINCIPIANTE</option><option>INTERMEDIO</option><option>AVANZADO</option></select></div>
  <div class="feed-field feed-field--full"><label for="postTitle">Título *</label><input id="postTitle" name="titulo" maxlength="180" required></div><div class="feed-field feed-field--full"><label for="postDescription">Descripción *</label><textarea id="postDescription" name="descripcion" maxlength="10000" required></textarea></div>
  <div class="feed-field feed-field--full"><label>Habilidades relacionadas</label><div class="feed-autocomplete"><div class="feed-autocomplete__field"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" width="16" height="16"><circle cx="11" cy="11" r="6" stroke="currentColor" stroke-width="1.7"/><path d="m16.5 16.5 3.5 3.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg><input id="postSkillSearch" type="text" placeholder="Buscar habilidad..." autocomplete="off"></div><ul class="feed-autocomplete__dropdown" id="postSkillDropdown"></ul><div class="feed-autocomplete__chips" id="postSkillChips"></div></div></div>
  <div class="feed-field"><label for="postAvailability">Disponibilidad</label><input id="postAvailability" name="disponibilidad" maxlength="255"></div>
  <div class="feed-field feed-field--full"><label>Archivos adjuntos (opcional)</label><div class="feed-dropzone" id="postDropzone"><div class="feed-dropzone__area"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" width="28" height="28"><path d="M12 16V4M8 8l4-4 4 4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg><p>Arrastrar archivos o hacer clic para buscar</p><small>Imágenes, PDF o DOCX (max 10 MB c/u)</small></div><input type="file" id="postFileInput" accept="image/*,.pdf,.doc,.docx" multiple hidden><div class="feed-dropzone__files" id="postFileList"></div></div></div>
  <p class="feed-error" role="alert"></p><button class="feed-submit">Publicar</button></form></div></div>`;
}

function initAutocomplete(input, dropdown, chipsContainer, sourceList, selectedList) {
  const filteredList = () => sourceList.filter((item) => !selectedList.some((s) => s.id_habilidad === item.id_habilidad));

  const renderDropdown = (query) => {
    const items = filteredList().filter((item) => item.nombre.toLowerCase().includes(query.toLowerCase()));
    if (!items.length || !query) { dropdown.classList.remove('is-open'); return; }
    dropdown.innerHTML = items.map((item) => `<li data-id="${item.id_habilidad}" data-name="${item.nombre}">${escapeHtml(item.nombre)} <small>${escapeHtml(item.categoria||'General')}</small></li>`).join('');
    dropdown.classList.add('is-open');
  };

  const renderChips = () => {
    chipsContainer.innerHTML = selectedList.map((item) => `<span class="feed-chip">${escapeHtml(item.nombre)}<button type="button" data-id="${item.id_habilidad}" aria-label="Eliminar ${item.nombre}">&times;</button></span>`).join('');
  };

  input.addEventListener('input', () => renderDropdown(input.value.trim()));

  dropdown.addEventListener('click', (event) => {
    const li = event.target.closest('[data-id]');
    if (!li) return;
    const item = sourceList.find((s) => s.id_habilidad === Number(li.dataset.id));
    if (item) selectedList.push(item);
    input.value = '';
    dropdown.classList.remove('is-open');
    renderChips();
  });

  chipsContainer.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-id]');
    if (!btn) return;
    const idx = selectedList.findIndex((s) => s.id_habilidad === Number(btn.dataset.id));
    if (idx !== -1) selectedList.splice(idx, 1);
    renderChips();
  });
}

function initDropzone(container, selectedFiles) {
  const area = container.querySelector('.feed-dropzone__area');
  const input = container.querySelector('#postFileInput');
  const list = container.querySelector('#postFileList');

  const renderFiles = () => {
    list.innerHTML = selectedFiles.map((file, i) => {
      const name = file.name || file.url_archivo;
      const icon = file.type?.startsWith('image/') ? '🖼' : '📄';
      return `<span class="feed-dropzone__file"><span>${icon} ${escapeHtml(name)}</span><button type="button" data-index="${i}" aria-label="Eliminar archivo">&times;</button></span>`;
    }).join('');
  };

  area.addEventListener('click', () => input.click());

  area.addEventListener('dragover', (e) => { e.preventDefault(); area.classList.add('is-dragover'); });
  area.addEventListener('dragleave', () => area.classList.remove('is-dragover'));
  area.addEventListener('drop', (e) => {
    e.preventDefault();
    area.classList.remove('is-dragover');
    for (const file of e.dataTransfer.files) {
      if (selectedFiles.length >= 10) break;
      if (!file.type.match(/^(image\/(jpeg|png|gif|webp)|application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document))$/)) continue;
      selectedFiles.push(file);
    }
    if (selectedFiles.length > 10) selectedFiles.length = 10;
    renderFiles();
  });

  input.addEventListener('change', () => {
    for (const file of input.files) {
      if (selectedFiles.length >= 10) break;
      selectedFiles.push(file);
    }
    if (selectedFiles.length > 10) selectedFiles.length = 10;
    renderFiles();
    input.value = '';
  });

  list.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-index]');
    if (!btn) return;
    selectedFiles.splice(Number(btn.dataset.index), 1);
    renderFiles();
  });
}

export async function renderFeedPage(container) {
  const user=getCurrentUser(); if(!user?.id_usuario){location.href='login.html';return;} container.innerHTML=shell(user);
  const list=container.querySelector('.feed-list'), modal=container.querySelector('.feed-modal'), form=container.querySelector('.feed-form'); let filters={};
  const selectedSkills = [];
  const selectedFiles = [];

  const load=async()=>{ list.innerHTML='<div class="feed-empty">Cargando publicaciones…</div>'; const posts=await getFeed(filters,user.id_usuario); if(posts.error){list.innerHTML=`<div class="feed-empty">${escapeHtml(posts.error)}</div>`;return;} list.innerHTML=posts.length?posts.map(p=>renderCard(p,user.id_usuario)).join(''):'<div class="feed-empty">No hay publicaciones con estos filtros. Sé la primera persona en compartir.</div>'; };
  const [skills]=await Promise.all([getFeedSkills(),load()]); if(!skills.error){ const options=skills.map(s=>`<option value="${s.id_habilidad}">${escapeHtml(s.nombre)} · ${escapeHtml(s.categoria||'General')}</option>`).join(''); container.querySelector('#skillFilter').insertAdjacentHTML('beforeend',options); }

  initAutocomplete(
    container.querySelector('#postSkillSearch'),
    container.querySelector('#postSkillDropdown'),
    container.querySelector('#postSkillChips'),
    skills.error ? [] : skills,
    selectedSkills
  );

  initDropzone(container.querySelector('#postDropzone'), selectedFiles);

  document.addEventListener('click', (event) => {
    document.querySelectorAll('.feed-autocomplete__dropdown.is-open').forEach((el) => {
      if (!el.closest('.feed-autocomplete')?.contains(event.target)) el.classList.remove('is-open');
    });
  });

  container.querySelectorAll('[data-open-modal]').forEach(btn=>btn.addEventListener('click',()=>{modal.hidden=false;container.querySelector('#postTitle').focus();})); container.querySelector('.feed-close').addEventListener('click',()=>modal.hidden=true); modal.addEventListener('click',e=>{if(e.target===modal)modal.hidden=true;});
  container.querySelectorAll('[data-type]').forEach(btn=>btn.addEventListener('click',()=>{container.querySelectorAll('[data-type]').forEach(b=>b.classList.remove('is-active'));btn.classList.add('is-active');filters.tipo=btn.dataset.type;load();})); container.querySelector('#skillFilter').addEventListener('change',e=>{filters.habilidad=e.target.value;load();});
  form.addEventListener('submit',async e=>{e.preventDefault(); const error=form.querySelector('.feed-error'); error.textContent=''; const data=new FormData(); data.append('tipo',form.querySelector('[name=tipo]').value); data.append('titulo',form.querySelector('[name=titulo]').value.trim()); data.append('descripcion',form.querySelector('[name=descripcion]').value.trim()); data.append('nivel',form.querySelector('[name=nivel]').value); data.append('disponibilidad',form.querySelector('[name=disponibilidad]').value.trim()); if(selectedSkills.length) data.append('habilidades',selectedSkills.map(s=>s.id_habilidad).join(',')); const titulo=data.get('titulo'),descripcion=data.get('descripcion'); if(!titulo||!descripcion){error.textContent='El título y la descripción son obligatorios.';return;} for(const file of selectedFiles) data.append('archivos',file); const result=await createPost(user.id_usuario,data); if(result.error){error.textContent=result.error;return;} form.reset();selectedSkills.length=0;selectedFiles.length=0;container.querySelector('#postSkillChips').innerHTML='';container.querySelector('#postFileList').innerHTML='';modal.hidden=true;toast('Publicación creada');load();});
  list.addEventListener('click',async e=>{const button=e.target.closest('[data-action]');if(!button)return;const card=button.closest('.feed-card'),id=card.dataset.postId;
    if(button.dataset.action==='react'){button.disabled=true;const result=await reactToPost(user.id_usuario,id,button.dataset.reaction);button.disabled=false;if(result.error)return toast(result.error,true);const active=result.reaccion===button.dataset.reaction;button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',String(active));button.textContent=`${active?'♥':'♡'} ${active?button.dataset.activeLabel:button.dataset.label}`;card.querySelector('[data-reaction-count]').textContent=`${result.total} reacciones`;}
    if(button.dataset.action==='save'){const result=await toggleSavedPost(user.id_usuario,id);if(result.error)return toast(result.error,true);button.classList.toggle('is-active',result.guardada);button.textContent=`🔖 ${result.guardada?'Guardado':'Guardar'}`;}
    if(button.dataset.action==='comments'){const section=card.querySelector('.feed-comments'),opening=!section.classList.contains('is-open');section.classList.toggle('is-open',opening);button.setAttribute('aria-expanded',String(opening));button.textContent=opening?'💬 Ocultar comentarios':'💬 Ver comentarios';if(opening){const commentsList=section.querySelector('[data-comments-list]');commentsList.innerHTML='<p class="feed-comments__status">Cargando comentarios…</p>';const comments=await getComments(id);commentsList.innerHTML=comments.error?`<p class="feed-comments__status is-error">${escapeHtml(comments.error)}</p>`:renderComments(comments);}}
  });
  list.addEventListener('submit',async e=>{if(!e.target.matches('.feed-comment-form'))return;e.preventDefault();const card=e.target.closest('.feed-card'),input=e.target.comentario,submit=e.target.querySelector('button');if(!input.value.trim())return;submit.disabled=true;const result=await addComment(user.id_usuario,card.dataset.postId,input.value.trim());submit.disabled=false;if(result?.error)return toast(result.error,true);if(!result)return toast('No se pudo recuperar el comentario creado.',true);input.value='';const comments=await getComments(card.dataset.postId);card.querySelector('[data-comments-list]').innerHTML=comments.error?`<p class="feed-comments__status is-error">${escapeHtml(comments.error)}</p>`:renderComments(comments);const count=card.querySelector('[data-comment-count]');count.textContent=`${Number.parseInt(count.textContent,10)+1} comentarios`;});
  container.querySelector('#logoutButton')?.addEventListener('click',()=>{clearCurrentUser();location.href='login.html';});
}
