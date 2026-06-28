export function createChatWidget(conversation) {
  return `
    <section class="chat-widget">
      <h2>Chat con ${conversation.partnerName}</h2>
      <div class="message-list"></div>
      <form class="chat-form">
        <input type="text" name="message" placeholder="Escribe un mensaje" />
        <button type="submit">Enviar</button>
      </form>
    </section>
  `;
}
