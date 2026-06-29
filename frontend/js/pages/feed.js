import { getCurrentUser, clearCurrentUser } from '../common/auth.js';
import { getFeed, getFeedSkills, createPost, getComments, addComment, reactToPost, toggleSavedPost } from '../services/api.js';
import { renderSidebar } from './dashboard.js';

const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[char]));
const initial = (value = '?') => escapeHtml(value.trim().charAt(0).toUpperCase() || '?');
const labels = { OFREZCO:'Ofrezco', BUSCO:'Busco', CONSULTA:'Consulta', RECURSO:'Recurso', LOGRO:'Logro', PRINCIPIANTE:'Principiante', INTERMEDIO:'Intermedio', AVANZADO:'Avanzado', VIRTUAL:'Virtual', PRESENCIAL:'Presencial', AMBAS:'Virtual y presencial' };

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
    ${tags ? `<div class="feed-tags">${tags}</div>` : ''}<div class="feed-details">${post.nivel?`<span>📈 ${labels[post.nivel]}</span>`:''}${post.modalidad?`<span>📍 ${labels[post.modalidad]}</span>`:''}${post.disponibilidad?`<span>🕒 ${escapeHtml(post.disponibilidad)}</span>`:''}</div>${files}
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
  <div class="feed-field"><label for="postSkills">Habilidades relacionadas</label><select id="postSkills" class="feed-skills" name="habilidades" multiple></select><small class="feed-help">Ctrl/Cmd + clic para elegir varias.</small></div><div class="feed-field"><label for="postMode">Modalidad</label><select id="postMode" name="modalidad"><option value="">No aplica</option><option>VIRTUAL</option><option>PRESENCIAL</option><option>AMBAS</option></select><label for="postAvailability">Disponibilidad</label><input id="postAvailability" name="disponibilidad" maxlength="255"></div>
  <div class="feed-field feed-field--full"><label for="postFile">Imagen, certificado o documento (URL opcional)</label><input id="postFile" name="url_archivo" type="url" placeholder="https://..."><select name="tipo_archivo"><option value="IMAGEN">Imagen</option><option value="CERTIFICADO">Certificado</option><option value="DOCUMENTO">Documento</option></select></div><p class="feed-error" role="alert"></p><button class="feed-submit">Publicar</button></form></div></div>`;
}

export async function renderFeedPage(container) {
  const user=getCurrentUser(); if(!user?.id_usuario){location.href='login.html';return;} container.innerHTML=shell(user);
  const list=container.querySelector('.feed-list'), modal=container.querySelector('.feed-modal'), form=container.querySelector('.feed-form'); let filters={};
  const load=async()=>{ list.innerHTML='<div class="feed-empty">Cargando publicaciones…</div>'; const posts=await getFeed(filters,user.id_usuario); if(posts.error){list.innerHTML=`<div class="feed-empty">${escapeHtml(posts.error)}</div>`;return;} list.innerHTML=posts.length?posts.map(p=>renderCard(p,user.id_usuario)).join(''):'<div class="feed-empty">No hay publicaciones con estos filtros. Sé la primera persona en compartir.</div>'; };
  const [skills]=await Promise.all([getFeedSkills(),load()]); if(!skills.error){ const options=skills.map(s=>`<option value="${s.id_habilidad}">${escapeHtml(s.nombre)} · ${escapeHtml(s.categoria||'General')}</option>`).join(''); container.querySelector('#postSkills').innerHTML=options; container.querySelector('#skillFilter').insertAdjacentHTML('beforeend',options); }
  container.querySelectorAll('[data-open-modal]').forEach(btn=>btn.addEventListener('click',()=>{modal.hidden=false;container.querySelector('#postTitle').focus();})); container.querySelector('.feed-close').addEventListener('click',()=>modal.hidden=true); modal.addEventListener('click',e=>{if(e.target===modal)modal.hidden=true;});
  container.querySelectorAll('[data-type]').forEach(btn=>btn.addEventListener('click',()=>{container.querySelectorAll('[data-type]').forEach(b=>b.classList.remove('is-active'));btn.classList.add('is-active');filters.tipo=btn.dataset.type;load();})); container.querySelector('#skillFilter').addEventListener('change',e=>{filters.habilidad=e.target.value;load();});
  form.addEventListener('submit',async e=>{e.preventDefault(); const data=new FormData(form), error=form.querySelector('.feed-error'); error.textContent=''; const post={tipo:data.get('tipo'),titulo:data.get('titulo').trim(),descripcion:data.get('descripcion').trim(),nivel:data.get('nivel'),modalidad:data.get('modalidad'),disponibilidad:data.get('disponibilidad').trim(),habilidades:data.getAll('habilidades').map(Number),archivos:data.get('url_archivo')?[{url_archivo:data.get('url_archivo'),tipo:data.get('tipo_archivo')}]:[]}; if(!post.titulo||!post.descripcion){error.textContent='El título y la descripción son obligatorios.';return;} const result=await createPost(user.id_usuario,post); if(result.error){error.textContent=result.error;return;} form.reset();modal.hidden=true;toast('Publicación creada');load();});
  list.addEventListener('click',async e=>{const button=e.target.closest('[data-action]');if(!button)return;const card=button.closest('.feed-card'),id=card.dataset.postId;
    if(button.dataset.action==='react'){button.disabled=true;const result=await reactToPost(user.id_usuario,id,button.dataset.reaction);button.disabled=false;if(result.error)return toast(result.error,true);const active=result.reaccion===button.dataset.reaction;button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',String(active));button.textContent=`${active?'♥':'♡'} ${active?button.dataset.activeLabel:button.dataset.label}`;card.querySelector('[data-reaction-count]').textContent=`${result.total} reacciones`;}
    if(button.dataset.action==='save'){const result=await toggleSavedPost(user.id_usuario,id);if(result.error)return toast(result.error,true);button.classList.toggle('is-active',result.guardada);button.textContent=`🔖 ${result.guardada?'Guardado':'Guardar'}`;}
    if(button.dataset.action==='comments'){const section=card.querySelector('.feed-comments'),opening=!section.classList.contains('is-open');section.classList.toggle('is-open',opening);button.setAttribute('aria-expanded',String(opening));button.textContent=opening?'💬 Ocultar comentarios':'💬 Ver comentarios';if(opening){const commentsList=section.querySelector('[data-comments-list]');commentsList.innerHTML='<p class="feed-comments__status">Cargando comentarios…</p>';const comments=await getComments(id);commentsList.innerHTML=comments.error?`<p class="feed-comments__status is-error">${escapeHtml(comments.error)}</p>`:renderComments(comments);}}
  });
  list.addEventListener('submit',async e=>{if(!e.target.matches('.feed-comment-form'))return;e.preventDefault();const card=e.target.closest('.feed-card'),input=e.target.comentario,submit=e.target.querySelector('button');if(!input.value.trim())return;submit.disabled=true;const result=await addComment(user.id_usuario,card.dataset.postId,input.value.trim());submit.disabled=false;if(result?.error)return toast(result.error,true);if(!result)return toast('No se pudo recuperar el comentario creado.',true);input.value='';const comments=await getComments(card.dataset.postId);card.querySelector('[data-comments-list]').innerHTML=comments.error?`<p class="feed-comments__status is-error">${escapeHtml(comments.error)}</p>`:renderComments(comments);const count=card.querySelector('[data-comment-count]');count.textContent=`${Number.parseInt(count.textContent,10)+1} comentarios`;});
  container.querySelector('#logoutButton')?.addEventListener('click',()=>{clearCurrentUser();location.href='login.html';});
}
