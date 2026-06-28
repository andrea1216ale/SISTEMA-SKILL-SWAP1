import { registerUser } from '../services/api.js';

export class RegisterForm {
  constructor(container) {
    this.container = container;
  }

  render() {
    this.container.innerHTML = `
      <div class="register-background">
        <a href="index.html" class="back-button">← Inicio</a>
        <div class="register-card">
          <h1>Skill Swap</h1>
          <h2>Crear tu perfil</h2>
          <p>Completa tus datos para empezar a intercambiar habilidades.</p>
          <form id="registroForm">
            <div class="row">
              <input id="nombre" type="text" placeholder="Nombre completo" required />
              <input id="correo" type="email" placeholder="Correo electrónico" required />
            </div>
            <div class="row">
              <input id="password" type="password" placeholder="Contraseña" required />
              <input id="edad" type="number" placeholder="Edad" required />
            </div>
            <h3>Idiomas que conoces</h3>
            <div class="options" id="idiomasOptions">
              <label><input type="checkbox" value="Español" /> Español</label>
              <label><input type="checkbox" value="Inglés" /> Inglés</label>
              <label><input type="checkbox" value="Francés" /> Francés</label>
              <label><input type="checkbox" value="Portugués" /> Portugués</label>
              <label><input type="checkbox" value="Italiano" /> Italiano</label>
              <label><input type="checkbox" value="Japonés" /> Japonés</label>
            </div>
            <h3>Habilidades que tienes</h3>
            <div class="options" id="habilidadesOptions">
              <label><input type="checkbox" value="Programación" /> Programación</label>
              <label><input type="checkbox" value="Diseño gráfico" /> Diseño gráfico</label>
              <label><input type="checkbox" value="Marketing digital" /> Marketing digital</label>
              <label><input type="checkbox" value="Fotografía" /> Fotografía</label>
              <label><input type="checkbox" value="Cocina" /> Cocina</label>
              <label><input type="checkbox" value="Edición de video" /> Edición de video</label>
              <label><input type="checkbox" value="Excel" /> Excel</label>
              <label><input type="checkbox" value="Inteligencia Artificial" /> Inteligencia Artificial</label>
            </div>
            <h3>Nivel principal</h3>
            <select id="nivel" required>
              <option value="">Selecciona nivel</option>
              <option value="Principiante">Principiante</option>
              <option value="Intermedio">Intermedio</option>
              <option value="Avanzado">Avanzado</option>
            </select>
            <button type="submit">Crear cuenta</button>
          </form>
        </div>
      </div>
    `;
    this.attachEvents();
  }

  attachEvents() {
    const form = this.container.querySelector('#registroForm');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const usuario = {
        nombre: this.container.querySelector('#nombre').value,
        correo: this.container.querySelector('#correo').value,
        password: this.container.querySelector('#password').value,
        edad: Number(this.container.querySelector('#edad').value),
        nivel: this.container.querySelector('#nivel').value,
        idiomas: this.getCheckedValues('#idiomasOptions input[type=checkbox]'),
        habilidades: this.getCheckedValues('#habilidadesOptions input[type=checkbox]'),
      };

      const result = await registerUser(usuario);
      alert(result.mensaje || result.error || 'Respuesta desconocida');
      if (result.mensaje) {
        form.reset();
      }
    });
  }

  getCheckedValues(selector) {
    return Array.from(this.container.querySelectorAll(selector))
      .filter((input) => input.checked)
      .map((input) => input.value);
  }
}
