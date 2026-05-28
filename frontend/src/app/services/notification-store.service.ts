import { Injectable, computed, signal } from '@angular/core';
import { SocketService } from './socket.service';
import { AuthService } from './auth.service';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'appointment' | 'message' | 'system';
  createdAt: string;
  read: boolean;
  sourceEvent: string;
  payload?: any;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationStoreService {
  private readonly maxItems = 150;
  private readonly notificationsSignal = signal<AppNotification[]>([]);
  private readonly toastSignal = signal<AppNotification | null>(null);

  readonly notifications = this.notificationsSignal.asReadonly();
  readonly currentToast = this.toastSignal.asReadonly();
  readonly unreadCount = computed(() => this.notificationsSignal().filter(n => !n.read).length);

  constructor(
    private socketService: SocketService,
    private authService: AuthService
  ) {
    this.restoreFromStorage();
    this.bindSocketEvents();
    this.bindAuthLifecycle();
  }

  private bindAuthLifecycle(): void {
    this.authService.currentUser$.subscribe((user) => {
      if (!user) {
        this.notificationsSignal.set([]);
        this.toastSignal.set(null);
        return;
      }

      this.restoreFromStorage();
    });
  }

  private bindSocketEvents(): void {
    this.socketService.getAppointmentCreatedObservable().subscribe((event: any) => {
      const role = this.authService.getCurrentUser()?.role;
      if (role !== 'doctor') {
        return;
      }

      const patientName = event?.appointment?.patientName || 'pacijenta';
      this.pushNotification({
        title: 'Novi termin',
        message: `Zakazan je novi termin od ${patientName}.`,
        type: 'success',
        category: 'appointment',
        sourceEvent: 'notification:appointment-created',
        payload: event
      });
    });

    this.socketService.getAppointmentUpdatedObservable().subscribe((event: any) => {
      const role = this.authService.getCurrentUser()?.role;
      if (role !== 'doctor' && role !== 'patient') {
        return;
      }

      const currentUser = this.authService.getCurrentUser();
      const newStatus = event?.newStatus || event?.status || '';
      const apptDate = event?.appointmentDate ? new Date(event.appointmentDate).toLocaleString() : '';
      let message = '';
      let notifType: 'info' | 'warning' | 'success' | 'error' = 'info';

      if (newStatus === 'canceled' || newStatus === 'cancelled') {
        notifType = 'warning';
        const reason = event?.cancellationReason || event?.reason || '';
        const cancelledByRole = event?.canceledByRole || event?.canceledBy || '';
        if (role === 'doctor') {
          message = `Pacijent ${event?.patientName || ''} je otkazao termin zakazan za ${apptDate}.${reason ? ' Razlog: ' + reason : ''}`;
        } else {
          // patient view
          const cancelledByUser = String(event?.canceledByUser || '');
          if (cancelledByUser && currentUser && cancelledByUser === String(currentUser._id)) {
            message = `Uspešno ste otkazali termin zakazan za ${apptDate}.${reason ? ' Razlog: ' + reason : ''}`;
          } else if (cancelledByRole === 'doctor') {
            message = `Vaš termin zakazan za ${apptDate} je otkazan od strane doktora.${reason ? ' Razlog: ' + reason : ''}`;
          } else {
            message = `Vaš termin zakazan za ${apptDate} je otkazan.${reason ? ' Razlog: ' + reason : ''}`;
          }
        }
      } else if (newStatus === 'rescheduled') {
        notifType = 'info';
        message = `Termin je prebačen na novo vreme: ${apptDate}.`;
      } else if (newStatus === 'confirmed') {
        notifType = 'success';
        message = `Termin je potvrđen za ${apptDate}.`;
      } else if (newStatus) {
        message = `Status termina je promenjen: ${this.formatStatus(newStatus)}.`;
      } else {
        message = 'Status termina je ažuriran.';
      }

      this.pushNotification({
        title: 'Promena statusa termina',
        message,
        type: notifType,
        category: 'appointment',
        sourceEvent: 'notification:appointment-updated',
        payload: event
      });
    });

    this.socketService.getNotificationObservable().subscribe((event: any) => {
      const role = this.authService.getCurrentUser()?.role;
      const sourceEvent = event?.__eventName || event?.type || 'notification:user-alert';

      if (role === 'admin' && sourceEvent !== 'notification:admin-alert' && sourceEvent !== 'notification:user-alert') {
        return;
      }

      const message = event?.message || 'Stiglo je novo obaveštenje.';
      this.pushNotification({
        title: 'Obaveštenje',
        message,
        type: 'info',
        category: 'system',
        sourceEvent,
        payload: event
      });
    });
  }

  private formatStatus(status: string | undefined): string {
    const labels: Record<string, string> = {
      scheduled: 'Zakazan',
      completed: 'Završen',
      canceled: 'Otkazan'
    };

    if (!status) {
      return 'Ažuriran';
    }

    return labels[status] || status;
  }

  private pushNotification(input: Omit<AppNotification, 'id' | 'createdAt' | 'read'>): void {
    const notification: AppNotification = {
      ...input,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      read: false
    };

    const current = this.notificationsSignal();
    const next = [notification, ...current].slice(0, this.maxItems);

    this.notificationsSignal.set(next);
    this.toastSignal.set(notification);
    this.persistToStorage();
  }

  dismissToast(): void {
    this.toastSignal.set(null);
  }

  markAsRead(id: string): void {
    const next = this.notificationsSignal().map((item) => {
      if (item.id !== id) {
        return item;
      }
      return { ...item, read: true };
    });

    this.notificationsSignal.set(next);
    this.persistToStorage();
  }

  markAllAsRead(): void {
    const next = this.notificationsSignal().map((item) => ({ ...item, read: true }));
    this.notificationsSignal.set(next);
    this.persistToStorage();
  }

  remove(id: string): void {
    const next = this.notificationsSignal().filter(item => item.id !== id);
    this.notificationsSignal.set(next);
    this.persistToStorage();
  }

  clearAll(): void {
    this.notificationsSignal.set([]);
    this.toastSignal.set(null);
    this.persistToStorage();
  }

  private persistToStorage(): void {
    if (typeof window === 'undefined') {
      return;
    }

    localStorage.setItem(this.storageKey(), JSON.stringify(this.notificationsSignal()));
  }

  private restoreFromStorage(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const raw = localStorage.getItem(this.storageKey());
    if (!raw) {
      this.notificationsSignal.set([]);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as AppNotification[];
      if (Array.isArray(parsed)) {
        this.notificationsSignal.set(parsed.slice(0, this.maxItems));
      }
    } catch {
      this.notificationsSignal.set([]);
    }
  }

  private storageKey(): string {
    const userId = this.authService.getCurrentUser()?._id || 'anonymous';
    return `medify_notifications_${userId}`;
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
}
