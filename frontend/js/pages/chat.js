import { getCurrentUser, clearCurrentUser } from '../common/auth.js';
import { renderSidebar } from './dashboard.js';
import { obtenerConversaciones, obtenerMensajes, marcarMensajeLeido } from '../services/chat.service.js';
import { SocketService } from '../services/socket.service.js';
import { chatList } from '../components/chat-list.js';
import { chatWindow } from '../components/chat-window.js';
import { messageItem } from '../components/message-item.js';

export async function renderChatPage(container) {
  const user = getCurrentUser();
  if (!user?.id_usuario) { location.href = 'login.html'; return; }
  container.innerHTML = `<div class="dash-layout">${renderSidebar(user, 'chat')}<main class="chat-page"><section class="chat-shell">
    <aside class="chat-sidebar"><header><h1>Mensajes</h1><span>Conversaciones privadas</span></header><div class="chat-list"><p class="chat-loading">Cargando...</p></div></aside>
    <section class="chat-window" aria-live="polite"></section></section></main></div>`;

  const list = container.querySelector('.chat-list');
  const view = container.querySelector('.chat-window');
  const socket = new SocketService(user.id_usuario);
  let conversations = [], current = null, messages = [], typingTimer;
  const scrollBottom = () => { const box = view.querySelector('.chat-messages'); if (box) box.scrollTop = box.scrollHeight; };
  const renderList = () => { list.innerHTML = chatList(conversations, current?.id_conversacion); };

  async function markUnread() {
    const unread = messages.filter((m) => Number(m.id_emisor) !== Number(user.id_usuario) && !m.leido);
    await Promise.all(unread.map((m) => marcarMensajeLeido(user.id_usuario, m.id_mensaje)));
    unread.forEach((m) => { m.leido = 1; socket.emit('messageRead', { id_mensaje: m.id_mensaje }); });
  }

  async function openConversation(id) {
    if (current) await socket.emit('leaveConversation', { id_conversacion: current.id_conversacion });
    current = conversations.find((c) => Number(c.id_conversacion) === Number(id));
    if (!current) return;
    renderList(); view.innerHTML = '<p class="chat-loading">Cargando mensajes...</p>';
    const response = await obtenerMensajes(user.id_usuario, id);
    if (!response.success) { view.innerHTML = `<p class="chat-error">${response.error}</p>`; return; }
    messages = response.data || [];
    const joined = await socket.emit('joinConversation', { id_conversacion: id });
    if (!joined?.success) { view.innerHTML = `<p class="chat-error">${joined?.error || 'Acceso denegado.'}</p>`; return; }
    view.innerHTML = chatWindow(current, messages, user.id_usuario);
    view.classList.add('is-open');
    bindComposer(); scrollBottom(); await markUnread();
    history.replaceState(null, '', `chat.html?idConversacion=${id}`);
  }

  function bindComposer() {
    const form = view.querySelector('.chat-composer');
    const input = form?.querySelector('input');
    if (!form) return;
    input.addEventListener('input', () => {
      socket.emit(input.value.trim() ? 'typing' : 'stopTyping', { id_conversacion: current.id_conversacion });
      clearTimeout(typingTimer);
      typingTimer = setTimeout(() => socket.emit('stopTyping', { id_conversacion: current.id_conversacion }), 1200);
    });
    form.addEventListener('submit', async (event) => {
      event.preventDefault(); const text = input.value.trim(); if (!text) return;
      input.disabled = true;
      const result = await socket.emit('sendMessage', { id_conversacion: current.id_conversacion, id_emisor: user.id_usuario, mensaje: text });
      input.disabled = false; input.focus();
      if (result?.success) { input.value = ''; socket.emit('stopTyping', { id_conversacion: current.id_conversacion }); }
      else alert(result?.error || 'No se pudo enviar el mensaje.');
    });
  }

  socket.on('newMessage', async (message) => {
    if (Number(message.id_conversacion) !== Number(current?.id_conversacion) || messages.some((m) => Number(m.id_mensaje) === Number(message.id_mensaje))) return;
    messages.push(message); view.querySelector('.chat-no-messages')?.remove();
    view.querySelector('.chat-messages')?.insertAdjacentHTML('beforeend', messageItem(message, user.id_usuario));
    scrollBottom(); if (Number(message.id_emisor) !== Number(user.id_usuario)) await markUnread();
  });
  socket.on('messageRead', ({ id_mensaje }) => {
    const message = messages.find((m) => Number(m.id_mensaje) === Number(id_mensaje)); if (message) message.leido = 1;
    const tick = view.querySelector(`[data-message="${id_mensaje}"] footer span`); if (tick) { tick.textContent = '✓✓'; tick.title = 'Leido'; }
  });
  socket.on('typing', ({ id_conversacion }) => { const el = view.querySelector('.chat-typing'); if (el && Number(id_conversacion) === Number(current?.id_conversacion)) el.hidden = false; });
  socket.on('stopTyping', () => { const el = view.querySelector('.chat-typing'); if (el) el.hidden = true; });
  list.addEventListener('click', (event) => { const item = event.target.closest('[data-conversation]'); if (item) openConversation(item.dataset.conversation); });
  view.addEventListener('click', async (event) => {
    if (!event.target.closest('.chat-back')) return;
    if (current) await socket.emit('leaveConversation', { id_conversacion: current.id_conversacion });
    current = null; messages = []; view.classList.remove('is-open'); renderList();
    history.replaceState(null, '', 'chat.html');
  });
  container.querySelector('#logoutButton')?.addEventListener('click', () => { socket.disconnect(); clearCurrentUser(); location.href = 'login.html'; });

  const response = await obtenerConversaciones(user.id_usuario);
  if (!response.success) { list.innerHTML = `<p class="chat-error">${response.error}</p>`; return; }
  conversations = response.data || []; renderList(); view.innerHTML = chatWindow(null, [], user.id_usuario);
  const requested = new URLSearchParams(location.search).get('idConversacion');
  if (requested && conversations.some((c) => Number(c.id_conversacion) === Number(requested))) openConversation(requested);
}
