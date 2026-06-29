import {
  aceptarSolicitud as aceptarSolicitudApi,
  obtenerDetalleIntercambio,
  obtenerOCrearConversacion as obtenerOCrearConversacionApi,
  obtenerSesionIntercambio as obtenerSesionIntercambioApi,
  obtenerSolicitudes as obtenerSolicitudesApi,
  rechazarSolicitud as rechazarSolicitudApi,
  solicitarIntercambio as solicitarIntercambioApi
} from './api.js';

export function obtenerSolicitudes(userId) {
  return obtenerSolicitudesApi(userId);
}

export function solicitarIntercambio(userId, solicitud) {
  return solicitarIntercambioApi(userId, solicitud);
}

export function aceptarSolicitud(userId, idIntercambio) {
  return aceptarSolicitudApi(userId, idIntercambio);
}

export function rechazarSolicitud(userId, idIntercambio) {
  return rechazarSolicitudApi(userId, idIntercambio);
}

export function obtenerDetalleSolicitud(userId, idIntercambio) {
  return obtenerDetalleIntercambio(userId, idIntercambio);
}

export function obtenerSesionIntercambio(userId, idIntercambio) {
  return obtenerSesionIntercambioApi(userId, idIntercambio);
}

export function obtenerOCrearConversacion(userId, idIntercambio) {
  return obtenerOCrearConversacionApi(userId, idIntercambio);
}
