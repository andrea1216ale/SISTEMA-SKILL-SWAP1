import { registerUser } from '../services/api.js';

export class RegisterForm {
  constructor(container) {
    this.container = container;
  }

  render() {
    this.container.innerHTML = `
      <main class="login-page register-page">
        <section class="login-intro" aria-labelledby="register-brand">
          <div class="login-intro__glow login-intro__glow--one"></div>
          <div class="login-intro__glow login-intro__glow--two"></div>

          <div class="login-intro__content">
            <a class="login-brand" href="index.html" id="register-brand" aria-label="Skill Swap, ir al inicio">
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
              <article class="login-benefit"><span class="login-benefit__number">01</span><div><h2>Comunidad auténtica</h2><p>Personas reales, conocimiento compartido.</p></div></article>
              <article class="login-benefit"><span class="login-benefit__number">02</span><div><h2>Sin costos ocultos</h2><p>Tu experiencia es la moneda de cambio.</p></div></article>
              <article class="login-benefit"><span class="login-benefit__number">03</span><div><h2>Simple y cercano</h2><p>Conecta y coordina sesiones en minutos.</p></div></article>
            </div>
          </div>
        </section>

        <section class="login-access register-access" aria-labelledby="register-title">
          <div class="login-access__inner register-access__inner">
            <a href="login.html" class="register-back" aria-label="Volver al inicio de sesión">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M10 7l-5 5 5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
              Volver al inicio de sesión
            </a>

            <header class="login-access__header register-access__header">
              <span class="login-access__kicker">Empieza hoy</span>
              <h2 id="register-title">Crea tu cuenta</h2>
              <p>Únete a una comunidad que aprende compartiendo.</p>
            </header>

            <form id="registroForm" class="login-form register-form">
              <div class="register-form__grid">
                <div class="register-control">
                  <label for="nombres">Nombres</label>
                  <div class="login-field">
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.5" stroke="currentColor" stroke-width="1.7"/><path d="M5.5 20v-2.2c0-3 2.9-5.3 6.5-5.3s6.5 2.3 6.5 5.3V20" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
                    <input id="nombres" type="text" autocomplete="given-name" placeholder="Juan" required />
                  </div>
                </div>

                <div class="register-control">
                  <label for="apellidoPaterno">Apellido paterno</label>
                  <div class="login-field login-field--plain"><input id="apellidoPaterno" type="text" autocomplete="family-name" placeholder="Pérez" required /></div>
                </div>

                <div class="register-control register-control--wide">
                  <label for="apellidoMaterno">Apellido materno (opcional)</label>
                  <div class="login-field login-field--plain"><input id="apellidoMaterno" type="text" placeholder="García" /></div>
                </div>

                <div class="register-control register-control--wide">
                  <label for="correo">Correo electrónico</label>
                  <div class="login-field">
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M4 6.5h16v11H4v-11Z" stroke="currentColor" stroke-width="1.7"/><path d="m5 8 7 5 7-5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    <input id="correo" type="email" autocomplete="email" placeholder="nombre@correo.com" required />
                  </div>
                </div>

                <div class="register-control">
                  <label for="password">Contraseña</label>
                  <div class="login-field">
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.7"/><path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" stroke="currentColor" stroke-width="1.7"/></svg>
                    <input id="password" type="password" autocomplete="new-password" minlength="8" placeholder="Mínimo 8 caracteres" required />
                  </div>
                </div>

                <div class="register-control">
                  <label for="confirmPassword">Confirmar contraseña</label>
                  <div class="login-field">
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.7"/><path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" stroke="currentColor" stroke-width="1.7"/></svg>
                    <input id="confirmPassword" type="password" autocomplete="new-password" minlength="8" placeholder="Repite tu contraseña" required />
                  </div>
                </div>

                <div class="register-control">
                  <label for="fechaNacimiento">Fecha de nacimiento</label>
                  <div class="login-field login-field--plain"><input id="fechaNacimiento" type="date" autocomplete="bday" required /></div>
                </div>

                <div class="register-control">
                  <label for="nivel">Nivel principal</label>
                  <div class="register-select-wrap">
                    <select id="nivel" required><option value="">Selecciona tu nivel</option><option value="Principiante">Principiante</option><option value="Intermedio">Intermedio</option><option value="Avanzado">Avanzado</option></select>
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="m8 10 4 4 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </div>
                </div>
              </div>

              <fieldset class="register-choices" id="idiomasOptions">
                <legend>Idiomas que conoces</legend>
                <div class="register-chips">
                  <label><input type="checkbox" value="Español" /><span>Español</span></label>
                  <label><input type="checkbox" value="Inglés" /><span>Inglés</span></label>
                  <label><input type="checkbox" value="Francés" /><span>Francés</span></label>
                  <label><input type="checkbox" value="Portugués" /><span>Portugués</span></label>
                  <label><input type="checkbox" value="Italiano" /><span>Italiano</span></label>
                  <label><input type="checkbox" value="Japonés" /><span>Japonés</span></label>
                </div>
              </fieldset>

              <fieldset class="register-choices" id="habilidadesOptions">
                <legend>Habilidades que puedes compartir</legend>
                <div class="register-chips">
                  <label><input type="checkbox" value="Programación" /><span>Programación</span></label>
                  <label><input type="checkbox" value="Diseño gráfico" /><span>Diseño gráfico</span></label>
                  <label><input type="checkbox" value="Marketing digital" /><span>Marketing</span></label>
                  <label><input type="checkbox" value="Fotografía" /><span>Fotografía</span></label>
                  <label><input type="checkbox" value="Cocina" /><span>Cocina</span></label>
                  <label><input type="checkbox" value="Edición de video" /><span>Video</span></label>
                  <label><input type="checkbox" value="Excel" /><span>Excel</span></label>
                  <label><input type="checkbox" value="Inteligencia Artificial" /><span>IA</span></label>
                </div>
              </fieldset>

              <label class="register-terms"><input type="checkbox" id="acceptTerms" required /><span>Acepto los <a href="#">términos y condiciones</a> y la <a href="#">política de privacidad</a>.</span></label>

              <button class="login-submit" type="submit"><span>Crear cuenta</span><svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M14 7l5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
              <p class="login-register">¿Ya tienes una cuenta? <a href="login.html">Inicia sesión</a></p>
            </form>
          </div>
        </section>
      </main>
    `;
    this.attachEvents();
  }

  attachEvents() {
    const form = this.container.querySelector('#registroForm');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const password = this.container.querySelector('#password');
      const confirmation = this.container.querySelector('#confirmPassword');
      confirmation.setCustomValidity(password.value === confirmation.value ? '' : 'Las contraseñas no coinciden.');
      if (!form.reportValidity()) return;

      const usuario = {
        nombres: this.container.querySelector('#nombres').value,
        apellido_paterno: this.container.querySelector('#apellidoPaterno').value,
        apellido_materno: this.container.querySelector('#apellidoMaterno').value,
        correo: this.container.querySelector('#correo').value,
        password: password.value,
        fecha_nacimiento: this.container.querySelector('#fechaNacimiento').value,
        nivel: this.container.querySelector('#nivel').value,
        idiomas: this.getCheckedValues('#idiomasOptions input[type=checkbox]'),
        habilidades: this.getCheckedValues('#habilidadesOptions input[type=checkbox]'),
      };

      const result = await registerUser(usuario);
      if (result.requiere_verificacion) {
        sessionStorage.setItem('correo_verificacion', result.correo);
        window.location.href = `verificar.html?correo=${encodeURIComponent(result.correo)}`;
        return;
      }
      alert(result.error || 'No se pudo crear la cuenta.');
    });

    this.container.querySelector('#confirmPassword').addEventListener('input', (event) => event.target.setCustomValidity(''));
  }

  getCheckedValues(selector) {
    return Array.from(this.container.querySelectorAll(selector)).filter((input) => input.checked).map((input) => input.value);
  }
}
