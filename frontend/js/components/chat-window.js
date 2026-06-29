import { messageItem } from './message-item.js';

const esc = (value = '') => String(value).replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));

export function chatWindow(conversation, messages, userId) {
  if (!conversation) return '<div class="chat-welcome"><span>↔</span><h2>Skill Swap Chat</h2><p>Selecciona una conversacion para comenzar.</p></div>';
  return `<header class="chat-window__header"><button class="chat-back" type="button" aria-label="Volver a conversaciones">←</button><span class="chat-avatar">${esc(conversation.otro_usuario || '?').charAt(0).toUpperCase()}</span>
      <div><strong>${esc(conversation.otro_usuario || 'Usuario')}</strong><small>${esc(conversation.habilidad || 'Intercambio')}</small></div></header>
    <div class="chat-messages">${messages.length ? messages.map((m) => messageItem(m, userId)).join('') : '<p class="chat-no-messages">Di hola para iniciar la conversacion.</p>'}</div>
    <div class="chat-typing" hidden>Escribiendo...</div>
    <form class="chat-composer"><input maxlength="5000" autocomplete="off" placeholder="Escribe un mensaje" aria-label="Mensaje"><button type="submit" aria-label="Enviar">➤</button></form>`;
}
