const esc = (value = '') => String(value).replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
const time = (value) => value ? new Date(value).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : '';

export function chatList(conversaciones, activeId) {
  if (!conversaciones.length) return '<div class="chat-empty-list">Aun no tienes conversaciones.</div>';
  return conversaciones.map((c) => `
    <button class="chat-contact ${Number(c.id_conversacion) === Number(activeId) ? 'is-active' : ''}" data-conversation="${c.id_conversacion}">
      <span class="chat-avatar">${esc(c.otro_usuario || '?').charAt(0).toUpperCase()}</span>
      <span class="chat-contact__body"><strong>${esc(c.otro_usuario || 'Usuario')}</strong><small>${esc(c.ultimo_mensaje || c.habilidad || 'Inicia la conversacion')}</small></span>
      <span class="chat-contact__meta"><time>${time(c.ultima_fecha)}</time>${Number(c.mensajes_no_leidos) ? `<b>${c.mensajes_no_leidos}</b>` : ''}</span>
    </button>`).join('');
}
