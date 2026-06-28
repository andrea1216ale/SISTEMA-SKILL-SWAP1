export function renderHeader(container) {
  container.insertAdjacentHTML('afterbegin', `
    <header class="app-header">
      <div class="brand">Skill Swap</div>
      <nav class="top-nav">
        <a href="dashboard.html">Dashboard</a>
        <a href="skills.html">Habilidades</a>
        <a href="search.html">Buscar</a>
        <a href="exchanges.html">Intercambios</a>
        <a href="chat.html">Chat</a>
        <a href="ratings.html">Calificaciones</a>
        <a href="admin.html">Admin</a>
      </nav>
    </header>
  `);
}
