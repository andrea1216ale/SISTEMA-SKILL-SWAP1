const nodemailer = require('nodemailer');

function createTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD) {
    const error = new Error('El servicio de correo no está configurado.');
    error.code = 'EMAIL_NOT_CONFIGURED';
    throw error;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  });
}

exports.sendVerificationCode = ({ correo, nombres, codigo }) => createTransporter().sendMail({
  from: process.env.SMTP_FROM || process.env.SMTP_USER,
  to: correo,
  subject: 'Verifica tu cuenta de Skill Swap',
  text: `Hola ${nombres}. Tu código es ${codigo} y expira en 10 minutos.`,
  html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto"><h2>Verifica tu cuenta</h2><p>Hola ${nombres}, usa este código para activar tu cuenta:</p><p style="font-size:32px;font-weight:bold;letter-spacing:8px">${codigo}</p><p>Expira en 10 minutos.</p></div>`,
});
