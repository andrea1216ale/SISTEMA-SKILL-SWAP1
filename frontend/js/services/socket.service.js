const SOCKET_URL = 'http://localhost:3000';

export class SocketService {
  constructor(idUsuario) {
    this.socket = window.io(SOCKET_URL, { auth: { idUsuario }, transports: ['websocket', 'polling'] });
  }
  on(event, handler) { this.socket.on(event, handler); }
  emit(event, payload) { return new Promise((resolve) => this.socket.emit(event, payload, resolve)); }
  disconnect() { this.socket.disconnect(); }
}
