import { enviarMensajeChatbot } from '../services/api.js';

const botIcon = `
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <rect x="5" y="8" width="14" height="11" rx="3"/><path d="M12 5V3M9 13h.01M15 13h.01M9 16h6M3 12h2M19 12h2"/>
  </svg>`;

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));
}

function messageTemplate(text, sender) {
  return `<div class="skillbot-message skillbot-message--${sender}"><p>${escapeHtml(text)}</p></div>`;
}

export function mountSkillbot() {
  if (document.querySelector('.skillbot')) return;

  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = 'css/skillbot.css';
  document.head.appendChild(stylesheet);

  const widget = document.createElement('aside');
  widget.className = 'skillbot';
  widget.innerHTML = `
    <section class="skillbot-panel" id="skillbotPanel" aria-label="Chat con SkillBot" hidden>
      <header class="skillbot-header">
        <span class="skillbot-avatar">${botIcon}</span>
        <div><strong>SkillBot</strong><small><i></i> En línea</small></div>
        <button type="button" class="skillbot-close" aria-label="Cerrar chatbot">×</button>
      </header>
      <div class="skillbot-messages" aria-live="polite">
        ${messageTemplate('¡Hola! Soy SkillBot. ¿Cómo puedo ayudarte con tus intercambios?', 'bot')}
      </div>
      <form class="skillbot-form">
        <label class="sr-only" for="skillbotInput">Escribe tu pregunta</label>
        <input id="skillbotInput" name="mensaje" type="text" maxlength="500" autocomplete="off" placeholder="Escribe tu pregunta..." required>
        <button type="submit" aria-label="Enviar mensaje">
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><path d="m4 4 17 8-17 8 3-8-3-8Z"/><path d="M7 12h14"/></svg>
        </button>
      </form>
    </section>
    <button type="button" class="skillbot-toggle" aria-controls="skillbotPanel" aria-expanded="false" aria-label="Abrir SkillBot">
      ${botIcon}<span></span>
    </button>`;

  document.body.appendChild(widget);

  const panel = widget.querySelector('.skillbot-panel');
  const toggle = widget.querySelector('.skillbot-toggle');
  const close = widget.querySelector('.skillbot-close');
  const form = widget.querySelector('.skillbot-form');
  const input = widget.querySelector('input');
  const messages = widget.querySelector('.skillbot-messages');

  const setOpen = (open) => {
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Cerrar SkillBot' : 'Abrir SkillBot');
    if (open) window.setTimeout(() => input.focus(), 50);
  };

  toggle.addEventListener('click', () => setOpen(panel.hidden));
  close.addEventListener('click', () => setOpen(false));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const mensaje = input.value.trim();
    if (!mensaje || form.classList.contains('is-sending')) return;

    messages.insertAdjacentHTML('beforeend', messageTemplate(mensaje, 'user'));
    input.value = '';
    form.classList.add('is-sending');
    input.disabled = true;
    messages.insertAdjacentHTML('beforeend', '<div class="skillbot-typing" role="status"><span></span><span></span><span></span></div>');
    messages.scrollTop = messages.scrollHeight;

    const response = await enviarMensajeChatbot(mensaje);
    messages.querySelector('.skillbot-typing')?.remove();

    const respuesta = response.success
      ? response.respuesta
      : response.message || 'No pude responder en este momento. Inténtalo nuevamente.';
    messages.insertAdjacentHTML('beforeend', messageTemplate(respuesta, response.success ? 'bot' : 'error'));
    form.classList.remove('is-sending');
    input.disabled = false;
    input.focus();
    messages.scrollTop = messages.scrollHeight;
  });
}
