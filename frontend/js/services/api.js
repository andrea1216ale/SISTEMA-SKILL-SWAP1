const API_BASE_URL = 'http://localhost:3000/api';

async function request(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = response.status === 204 ? {} : await response.json();

    if (!response.ok) {
      const message = data.message || data.error || 'Ocurrio un error en el servidor.';
      return { success: false, message, data: data.data || null, error: message };
    }

    return data;
  } catch {
    return {
      success: false,
      message: 'No se pudo conectar con el servidor.',
      data: null,
      error: 'No se pudo conectar con el servidor.'
    };
  }
}

export async function registerUser(usuario) {
  return request('/registro', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(usuario)
  });
}

export async function loginUser(credentials) {
  return request('/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(credentials)
  });
}

function authenticatedOptions(userId, options = {}) {
  return {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': String(userId),
      ...(options.headers || {})
    }
  };
}

export async function verifyEmail(data) {
  return request('/verificar-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

export async function resendVerificationCode(correo) {
  return request('/reenviar-codigo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo })
  });
}

export function getDashboard(userId) {
  return request(`/dashboard/${encodeURIComponent(userId)}`);
}

export function getProfile(userId) {
  return request(`/profile/${encodeURIComponent(userId)}`);
}

export function updateProfile(userId, profile) {
  return request(`/profile/${encodeURIComponent(userId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile)
  });
}

export function searchPeople({ userId, q = '', category = '', page = 1, limit = 8 }) {
  const params = new URLSearchParams({ userId, q, category, page, limit });
  return request(`/search?${params.toString()}`);
}

export function getFeed(filters = {}, userId = 0) {
  const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
  return request(`/publicaciones?${params}`, { headers: { 'X-User-Id': String(userId) } });
}

export function getFeedSkills() {
  return request('/habilidades-feed');
}

export function createPost(userId, post) {
  return request('/publicaciones', authenticatedOptions(userId, { method: 'POST', body: JSON.stringify(post) }));
}

export function updatePost(userId, id, post) {
  return request(`/publicaciones/${id}`, authenticatedOptions(userId, { method: 'PUT', body: JSON.stringify(post) }));
}

export function deletePost(userId, id) {
  return request(`/publicaciones/${id}`, authenticatedOptions(userId, { method: 'DELETE' }));
}

export function getComments(id) {
  return request(`/publicaciones/${id}/comentarios`);
}

export function addComment(userId, id, comentario) {
  return request(`/publicaciones/${id}/comentarios`, authenticatedOptions(userId, {
    method: 'POST',
    body: JSON.stringify({ comentario })
  }));
}

export function reactToPost(userId, id, tipo) {
  return request(`/publicaciones/${id}/reacciones`, authenticatedOptions(userId, {
    method: 'POST',
    body: JSON.stringify({ tipo })
  }));
}

export function toggleSavedPost(userId, id) {
  return request(`/publicaciones/${id}/guardar`, authenticatedOptions(userId, { method: 'POST' }));
}

export function getSavedPosts(userId) {
  return request(`/usuarios/${userId}/publicaciones-guardadas`, authenticatedOptions(userId));
}

export function obtenerCalificaciones(userId) {
  return request('/calificaciones', authenticatedOptions(userId));
}

export function obtenerCalificacionesUsuario(userId, targetUserId) {
  return request(`/calificaciones/usuario/${encodeURIComponent(targetUserId)}`, authenticatedOptions(userId));
}

export function crearCalificacion(userId, data) {
  return request('/calificaciones', authenticatedOptions(userId, {
    method: 'POST',
    body: JSON.stringify(data)
  }));
}

export function obtenerSolicitudes(userId) {
  return request('/intercambios/solicitudes', authenticatedOptions(userId));
}

export function solicitarIntercambio(userId, data) {
  return request('/intercambios/solicitar', authenticatedOptions(userId, {
    method: 'POST',
    body: JSON.stringify(data)
  }));
}

export function obtenerDetalleIntercambio(userId, id) {
  return request(`/intercambios/${id}`, authenticatedOptions(userId));
}

export function obtenerSesionIntercambio(userId, id) {
  return request(`/intercambios/${id}/sesion`, authenticatedOptions(userId));
}

export function obtenerOCrearConversacion(userId, id) {
  return request(`/intercambios/${id}/conversacion`, authenticatedOptions(userId, { method: 'POST' }));
}

export function aceptarSolicitud(userId, id) {
  return request(`/intercambios/${id}/aceptar`, authenticatedOptions(userId, { method: 'PATCH' }));
}

export function rechazarSolicitud(userId, id) {
  return request(`/intercambios/${id}/rechazar`, authenticatedOptions(userId, { method: 'PATCH' }));
}

export function enviarMensajeChatbot(mensaje) {
  return request('/chatbot/mensaje', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mensaje })
  });
}

export function obtenerNotificaciones(userId, filters = {}) {
  const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== '' && value != null));
  return request(`/notificaciones?${params.toString()}`, authenticatedOptions(userId));
}

export function obtenerResumenNotificaciones(userId) {
  return request('/notificaciones/resumen', authenticatedOptions(userId));
}

export function marcarNotificacionLeida(userId, idNotificacion) {
  return request(`/notificaciones/${encodeURIComponent(idNotificacion)}/leida`, authenticatedOptions(userId, {
    method: 'PATCH'
  }));
}

export function marcarTodasNotificacionesLeidas(userId) {
  return request('/notificaciones/leer-todas', authenticatedOptions(userId, {
    method: 'PATCH'
  }));
}

export function eliminarNotificacion(userId, idNotificacion) {
  return request(`/notificaciones/${encodeURIComponent(idNotificacion)}`, authenticatedOptions(userId, {
    method: 'DELETE'
  }));
}

export function obtenerPreferenciasNotificaciones(userId) {
  return request('/notificaciones/preferencias', authenticatedOptions(userId));
}

export function actualizarPreferenciasNotificaciones(userId, preferencias) {
  return request('/notificaciones/preferencias', authenticatedOptions(userId, {
    method: 'PUT',
    body: JSON.stringify(preferencias)
  }));
}
