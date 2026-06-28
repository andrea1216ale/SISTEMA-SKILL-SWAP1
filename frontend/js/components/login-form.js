import { loginUser } from '../services/api.js';
import { saveCurrentUser } from '../common/auth.js';

export class LoginForm {
  constructor(container) {
    this.container = container;
  }

  render() {
    this.container.innerHTML = `
      <main class="login-page">
        <section class="login-intro" aria-labelledby="login-brand">
          <div class="login-intro__glow login-intro__glow--one"></div>
          <div class="login-intro__glow login-intro__glow--two"></div>

          <div class="login-intro__content">
            <a class="login-brand" href="index.html" id="login-brand" aria-label="Skill Swap, ir al inicio">
              <span class="login-brand__mark" aria-hidden="true">
                <svg viewBox="0 0 48 48" fill="none"><path d="M24 6c1.5 9.7 4.3 12.5 14 14-9.7 1.5-12.5 4.3-14 14-1.5-9.7-4.3-12.5-14-14 9.7-1.5 12.5-4.3 14-14Z" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M37 7v7M33.5 10.5h7M11 34v5M8.5 36.5h5" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>
              </span>
              <span>Skill Swap</span>
            </a>

            <div class="login-intro__message">
              <p class="login-eyebrow">Aprender nos conecta</p>
              <h1>Comparte lo que sabes.<br><em>Descubre lo que puedes.</em></h1>
              <p class="login-intro__copy">Encuentra personas con tus mismas inquietudes, intercambia conocimientos y avanza acompañado.</p>
            </div>

            <div class="login-benefits" aria-label="Beneficios de Skill Swap">
              <article class="login-benefit">
                <span class="login-benefit__number">01</span>
                <div><h2>Comunidad auténtica</h2><p>Personas reales, conocimiento compartido.</p></div>
              </article>
              <article class="login-benefit">
                <span class="login-benefit__number">02</span>
                <div><h2>Sin costos ocultos</h2><p>Tu experiencia es la moneda de cambio.</p></div>
              </article>
              <article class="login-benefit">
                <span class="login-benefit__number">03</span>
                <div><h2>Simple y cercano</h2><p>Conecta y coordina sesiones en minutos.</p></div>
              </article>
            </div>
          </div>
        </section>

        <section class="login-access" aria-labelledby="login-title">
          <div class="login-access__inner">
            <header class="login-access__header">
              <span class="login-access__kicker">Qué gusto verte</span>
              <h2 id="login-title">Bienvenido de nuevo</h2>
              <p>Ingresa a tu cuenta para continuar aprendiendo.</p>
            </header>

            <form id="loginForm" class="login-form">
              <label for="loginEmail">Correo electrónico</label>
              <div class="login-field">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M4 6.5h16v11H4v-11Z" stroke="currentColor" stroke-width="1.7"/><path d="m5 8 7 5 7-5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <input type="email" id="loginEmail" autocomplete="email" placeholder="nombre@correo.com" required />
              </div>

              <label for="loginPassword">Contraseña</label>
              <div class="login-field">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.7"/><path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" stroke="currentColor" stroke-width="1.7"/></svg>
                <input type="password" id="loginPassword" autocomplete="current-password" placeholder="Tu contraseña" required />
              </div>

              <div class="login-form__options">
                <label class="login-remember"><input type="checkbox" id="rememberMe" /><span>Recordarme</span></label>
                <a href="#">¿Olvidaste tu contraseña?</a>
              </div>

              <button class="login-submit" type="submit">
                <span>Iniciar sesión</span>
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M14 7l5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
              <p class="login-register">¿Aún no tienes una cuenta? <a href="registro.html">Crea una gratis</a></p>
            </form>

            <aside class="login-note">
              <span aria-hidden="true">✦</span>
              <p><strong>Tu próxima habilidad empieza aquí.</strong><br>Conecta con personas listas para compartir lo que saben.</p>
            </aside>
          </div>
        </section>
      </main>
    `;
    this.attachEvents();
  }

  attachEvents() {
    const form = this.container.querySelector('#loginForm');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const credentials = {
        correo: this.container.querySelector('#loginEmail').value,
        password: this.container.querySelector('#loginPassword').value,
      };

      const result = await loginUser(credentials);
      if (result.user) {
        saveCurrentUser(result.user);
        window.location.href = 'dashboard.html';
        return;
      }
      alert(result.error || 'No se pudo iniciar sesión.');
    });
  }
}
