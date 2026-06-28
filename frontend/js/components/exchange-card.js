export function createExchangeCard(exchange) {
  return `
    <article class="exchange-card">
      <h3>Intercambio con ${exchange.providerName}</h3>
      <p>${exchange.message}</p>
      <span>Estado: ${exchange.status}</span>
    </article>
  `;
}
