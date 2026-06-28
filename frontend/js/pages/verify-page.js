import { resendVerificationCode, verifyEmail } from '../services/api.js';

const form = document.querySelector('#verifyForm');
const emailInput = document.querySelector('#verifyEmail');
const codeInput = document.querySelector('#verifyCode');
const message = document.querySelector('#verifyMessage');
const verifyButton = document.querySelector('#verifyButton');
const resendButton = document.querySelector('#resendButton');

const queryEmail = new URLSearchParams(window.location.search).get('correo');
emailInput.value = queryEmail || sessionStorage.getItem('correo_verificacion') || '';

function showMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle('verify-message--error', isError);
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  verifyButton.disabled = true;
  showMessage('Verificando…');
  const result = await verifyEmail({ correo: emailInput.value, codigo: codeInput.value });
  verifyButton.disabled = false;
  if (result.error) return showMessage(result.error, true);

  sessionStorage.removeItem('correo_verificacion');
  showMessage(result.mensaje);
  setTimeout(() => { window.location.href = 'login.html'; }, 1200);
});

resendButton.addEventListener('click', async () => {
  if (!emailInput.reportValidity()) return;
  resendButton.disabled = true;
  showMessage('Enviando un código nuevo…');
  const result = await resendVerificationCode(emailInput.value);
  resendButton.disabled = false;
  showMessage(result.error || result.mensaje, Boolean(result.error));
});
