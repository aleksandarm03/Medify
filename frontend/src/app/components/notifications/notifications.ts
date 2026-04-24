import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationStoreService, AppNotification } from '../../services/notification-store.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.html',
  styleUrl: './notifications.css'
})
export class NotificationsComponent {
  constructor(public notificationStore: NotificationStoreService) {}

  get notifications() {
    return this.notificationStore.notifications();
  }

  get unreadCount() {
    return this.notificationStore.unreadCount();
  }

  get hasNotifications() {
    return this.notifications.length > 0;
  }

  markRead(notification: AppNotification): void {
    if (!notification.read) {
      this.notificationStore.markAsRead(notification.id);
    }
  }

  remove(notification: AppNotification): void {
    this.notificationStore.remove(notification.id);
  }

  formatDate(value: string): string {
    return new Date(value).toLocaleString('sr-RS');
  }
}
