export function renderHomePage(container) {
  container.innerHTML = `
    <div class="background">
      <div class="login-card">
        <h1>Skill Swap</h1>
        <h2>Bienvenido</h2>
        <p>Comparte conocimientos y aprende nuevas habilidades con facilidad.</p>
        <div class="page-actions">
          <a class="primary-button" href="login.html">Iniciar sesión</a>
          <a class="secondary-button" href="registro.html">Crear cuenta</a>
        </div>
      </div>
    </div>
  `;
}
