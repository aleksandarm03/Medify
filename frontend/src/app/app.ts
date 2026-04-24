import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SocketService } from './services/socket.service';
import { NotificationStoreService } from './services/notification-store.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  currentYear = new Date().getFullYear();

  constructor(
    private socketService: SocketService,
    private notificationStore: NotificationStoreService
  ) {
    void this.socketService;
    void this.notificationStore;
  }
}
