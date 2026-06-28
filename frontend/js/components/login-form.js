import { loginUser } from '../services/api.js';

export class LoginForm {
  constructor(container) {
    this.container = container;
  }

  render() {
    this.container.innerHTML = `
      <div class="background">
        <div class="login-card">
          <h1>Skill Swap</h1>
          <h2>Iniciar sesión</h2>
          <p>Comparte conocimientos, aprende nuevas habilidades.</p>
          <form id="loginForm">
            <input type="email" id="loginEmail" placeholder="Correo electrónico" required />
            <input type="password" id="loginPassword" placeholder="Contraseña" required />
            <button type="submit">Ingresar</button>
            <a href="#">¿Olvidaste tu contraseña?</a>
            <span>¿No tienes cuenta? <a href="registro.html">Crear cuenta</a></span>
          </form>
        </div>
      </div>
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
      alert(result.mensaje || result.error || 'Respuesta desconocida');
    });
  }
}
