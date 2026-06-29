const esc = (value = '') => String(value).replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));

export function messageItem(message, userId) {
  const own = Number(message.id_emisor) === Number(userId);
  const date = new Date(message.fecha_envio).toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  return `<article class="chat-message ${own ? 'is-own' : 'is-received'}" data-message="${message.id_mensaje}">
    <p>${esc(message.mensaje)}</p><footer><time>${date}</time>${own ? `<span title="${message.leido ? 'Leido' : 'Enviado'}">${message.leido ? '✓✓' : '✓'}</span>` : ''}</footer>
  </article>`;
}
