const API_URL = 'http://localhost:3000/api/chat';

async function request(path, userId, options = {}) {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', 'X-User-Id': String(userId), ...options.headers }
    });
    const body = await response.json();
    return response.ok ? body : { success: false, error: body.error || body.message || 'Error de comunicacion.' };
  } catch {
    return { success: false, error: 'No se pudo conectar con el servidor.' };
  }
}

export const obtenerConversaciones = (userId) => request(`/conversaciones/${userId}`, userId);
export const obtenerMensajes = (userId, idConversacion) => request(`/mensajes/${idConversacion}`, userId);
export const marcarMensajeLeido = (userId, idMensaje) => request(`/mensajes/${idMensaje}/leido`, userId, { method: 'PATCH' });
