export function renderSolicitarIntercambioModal() {
  return `
    <div class="swap-request-modal" id="swapRequestModal" hidden>
      <div class="swap-request-modal__backdrop" data-swap-close></div>
      <section class="swap-request-modal__panel" role="dialog" aria-modal="true" aria-labelledby="swapRequestTitle">
        <header>
          <div>
            <p>Intercambio</p>
            <h2 id="swapRequestTitle">Solicitar intercambio</h2>
          </div>
          <button type="button" class="swap-request-modal__close" data-swap-close aria-label="Cerrar">x</button>
        </header>
        <form id="swapRequestForm" class="swap-request-form">
          <input type="hidden" id="swapReceiverId">
          <input type="hidden" id="swapSkillId">
          <label>
            <span>Usuario</span>
            <input id="swapReceiverName" type="text" disabled>
          </label>
          <label>
            <span>Habilidad</span>
            <input id="swapSkillName" type="text" disabled>
          </label>
          <label>
            <span>Mensaje opcional</span>
            <textarea id="swapMessage" maxlength="500" rows="4" placeholder="Hola, me gustaria aprender esta habilidad contigo."></textarea>
          </label>
          <div class="swap-request-form__feedback" role="status" aria-live="polite" hidden></div>
          <div class="swap-request-form__actions">
            <button type="button" class="swap-request-btn swap-request-btn--secondary" data-swap-close>Cancelar</button>
            <button type="submit" class="swap-request-btn swap-request-btn--primary">Enviar solicitud</button>
          </div>
        </form>
      </section>
    </div>
  `;
}

export function openSolicitarIntercambioModal(container, person) {
  const modal = container.querySelector('#swapRequestModal');
  const form = container.querySelector('#swapRequestForm');
  const feedback = container.querySelector('.swap-request-form__feedback');

  modal.hidden = false;
  form.reset();
  feedback.hidden = true;
  feedback.textContent = '';
  feedback.className = 'swap-request-form__feedback';

  form.querySelector('#swapReceiverId').value = Number(person.id_usuario);
  form.querySelector('#swapSkillId').value = Number(person.id_habilidad);
  form.querySelector('#swapReceiverName').value = person.nombre || 'Usuario';
  form.querySelector('#swapSkillName').value = person.habilidad || 'Habilidad';
  form.querySelector('#swapMessage').focus();
}

export function closeSolicitarIntercambioModal(container) {
  const modal = container.querySelector('#swapRequestModal');
  if (modal) modal.hidden = true;
}

export function getSolicitarIntercambioPayload(container) {
  const form = container.querySelector('#swapRequestForm');
  return {
    idUsuarioRecibe: Number(form.querySelector('#swapReceiverId').value),
    idHabilidad: Number(form.querySelector('#swapSkillId').value),
    mensaje: form.querySelector('#swapMessage').value.trim()
  };
}

export function showSolicitarIntercambioFeedback(container, message, type = 'success') {
  const feedback = container.querySelector('.swap-request-form__feedback');
  feedback.textContent = message;
  feedback.className = `swap-request-form__feedback swap-request-form__feedback--${type}`;
  feedback.hidden = false;
}
