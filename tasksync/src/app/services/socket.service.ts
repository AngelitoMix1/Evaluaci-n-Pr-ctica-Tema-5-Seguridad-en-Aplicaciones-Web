import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket!: Socket;
  private url = 'https://localhost:3000';

  connect(token: string) {
    this.socket = io(this.url, {
      auth: { token },
      secure: true
    });

    // 🕵️‍♂️ Monitoreo silencioso: Nos avisará en consola sin romper la pantalla
    this.socket.on('connect', () => console.log('✅ Canal de Sockets HTTPS conectado'));
    this.socket.on('connect_error', (err) => console.warn('⚠️ Advertencia de Socket:', err.message));
  }

  disconnect() {
    if (this.socket) this.socket.disconnect();
  }

  listen(eventName: string): Observable<any> {
    return new Observable((subscriber) => {
      this.socket.on(eventName, (data) => {
        subscriber.next(data);
      });
      // 🚫 Eliminamos la línea que causaba el choque fatal en Angular
    });
  }
}