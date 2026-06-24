import { Injectable, computed, signal } from '@angular/core';
import { SocketService } from './socket.service';
import { AuthService } from './auth.service';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'appointment' | 'message' | 'system' | 'prescription' | 'medical-record' | 'video-call';
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
      let message = typeof event?.message === 'string' ? event.message.trim() : '';
      let notifType: 'info' | 'warning' | 'success' | 'error' = 'info';
      let title = 'Promena statusa termina';

      if (newStatus === 'canceled' || newStatus === 'cancelled') {
        notifType = 'warning';
        if (role === 'doctor' && (event?.canceledByRole === 'patient')) {
          title = 'Pacijent je otkazao termin';
        }
      }

      if (!message && (newStatus === 'canceled' || newStatus === 'cancelled')) {
        const serviceName = event?.serviceName || event?.reason || 'nepoznata usluga';
        const appointmentDate = this.formatCanceledAppointmentDate(event?.appointmentDate) || 'nepoznat termin';
        const cancelledByRole = event?.canceledByRole || event?.canceledBy || '';
        const cancelledByUser = this.resolveUserId(event?.canceledByUser);
        const isSelfCancellation = !!(cancelledByUser && currentUser && cancelledByUser === String(currentUser._id));

        if (role === 'doctor') {
          if (isSelfCancellation || cancelledByRole === 'doctor') {
            message = `Uspešno ste otkazali termin za uslugu „${serviceName}”, koji je bio zakazan za ${appointmentDate}.`;
          } else if (cancelledByRole === 'patient') {
            message = `Pacijent ${event?.patientName || ''} je otkazao termin za uslugu „${serviceName}”, koji je bio zakazan za ${appointmentDate}.`;
          } else if (cancelledByRole === 'admin') {
            message = `Termin za uslugu „${serviceName}”, koji je bio zakazan za ${appointmentDate}, je otkazan od strane administratora.`;
          } else {
            message = `Termin za uslugu „${serviceName}”, koji je bio zakazan za ${appointmentDate}, je otkazan.`;
          }
        } else {
          // patient view
          if (isSelfCancellation || cancelledByRole === 'patient') {
            message = `Uspešno ste otkazali termin za uslugu „${serviceName}”, koji je bio zakazan za ${appointmentDate}.`;
          } else if (cancelledByRole === 'doctor') {
            message = `Vaš termin za uslugu „${serviceName}”, koji je bio zakazan za ${appointmentDate}, je otkazan od strane doktora.`;
          } else if (cancelledByRole === 'admin') {
            message = `Vaš termin za uslugu „${serviceName}”, koji je bio zakazan za ${appointmentDate}, je otkazan od strane administratora.`;
          } else {
            message = `Vaš termin za uslugu „${serviceName}”, koji je bio zakazan za ${appointmentDate}, je otkazan.`;
          }
        }
      } else if (!message && newStatus === 'rescheduled') {
        notifType = 'info';
        message = `Termin je prebačen na novo vreme: ${apptDate}.`;
      } else if (!message && newStatus === 'confirmed') {
        notifType = 'success';
        message = `Termin je potvrđen za ${apptDate}.`;
      } else if (!message && newStatus) {
        message = `Status termina je promenjen: ${this.formatStatus(newStatus)}.`;
      } else if (!message) {
        message = 'Status termina je ažuriran.';
      }

      this.pushNotification({
        title,
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

      if (sourceEvent === 'notification:broadcast' && event?.targetRole && role !== event.targetRole) {
        return;
      }

      if (sourceEvent === 'notification:doctor-alert' && role !== 'doctor') {
        return;
      }

      if (sourceEvent === 'notification:patient-alert' && role !== 'patient') {
        return;
      }

      const isAdminTargetedBroadcast =
        role === 'admin' && sourceEvent === 'notification:broadcast' && event?.targetRole === 'admin';

      if (
        role === 'admin' &&
        sourceEvent !== 'notification:admin-alert' &&
        sourceEvent !== 'notification:user-alert' &&
        !isAdminTargetedBroadcast
      ) {
        return;
      }

      // Build friendly messages for specific notification types
      let title = 'Obaveštenje';
      let message = event?.message || 'Stiglo je novo obaveštenje.';
      let type: AppNotification['type'] = this.resolveNotificationType(event?.type || event?.severity);

      if (sourceEvent === 'notification:prescription-added' || sourceEvent === 'notification:prescription-updated') {
        const currentUser = this.authService.getCurrentUser();
        if (currentUser?.role !== 'patient') {
          return;
        }
        if (event?.patientId && currentUser._id && String(event.patientId) !== String(currentUser._id)) {
          return;
        }

        const prescriptionNotice = this.buildPrescriptionPatientNotice(event);
        title = prescriptionNotice.title;
        message = prescriptionNotice.message;
        type = prescriptionNotice.type;
      } else if (sourceEvent === 'notification:medical-record-updated') {
        const currentUser = this.authService.getCurrentUser();
        if (currentUser?.role !== 'patient') {
          return;
        }
        if (event?.patientId && currentUser._id && String(event.patientId) !== String(currentUser._id)) {
          return;
        }

        title = event?.title || 'Ažuriranje kartona';
        if (event?.message) {
          message = event.message;
          type = event?.action === 'created' ? 'success' : 'info';
        } else {
          const doctor = event?.doctorName || '';
          const summary = event?.recordSummary || '';
          message = doctor
            ? `Doktor ${doctor} je ažurirao vaš medicinski karton${summary ? ': ' + summary : ''}`
            : `Vaš medicinski karton je ažuriran${summary ? ': ' + summary : ''}`;
          type = 'info';
        }
      } else if (sourceEvent === 'notification:patient-message') {
        title = 'Nova poruka pacijenta';
        message = event?.message || 'Stigla je nova poruka pacijenta.';
        type = 'info';
      } else if (sourceEvent === 'notification:video-call-incoming') {
        title = 'Dolazni video poziv';
        message = 'Doktor vas poziva na video konsultaciju.';
        type = 'info';
      } else if (sourceEvent === 'notification:video-call-accepted') {
        title = 'Video poziv prihvaćen';
        message = 'Pacijent je prihvatio video poziv.';
        type = 'success';
      } else if (sourceEvent === 'notification:video-call-rejected') {
        title = 'Video poziv odbijen';
        message = event?.reason
          ? `Pacijent je odbio video poziv. Razlog: ${event.reason}`
          : 'Pacijent je odbio video poziv.';
        type = 'warning';
      } else if (sourceEvent === 'notification:appointment-in-progress') {
        title = 'Pregled je počeo';
        message = 'Termin je označen kao pregled u toku.';
        type = 'info';
      } else if (sourceEvent === 'notification:appointment-completed') {
        title = 'Pregled je završen';
        message = 'Termin je označen kao završen.';
        type = 'success';
      } else {
        message = event?.message || message;
      }

      const category: AppNotification['category'] =
        sourceEvent === 'notification:prescription-added' || sourceEvent === 'notification:prescription-updated'
          ? 'prescription'
          : sourceEvent === 'notification:medical-record-updated'
            ? 'medical-record'
            : sourceEvent === 'notification:patient-message'
              ? 'message'
              : sourceEvent === 'notification:video-call-incoming' ||
                  sourceEvent === 'notification:video-call-accepted' ||
                  sourceEvent === 'notification:video-call-rejected'
                ? 'video-call'
                : sourceEvent === 'notification:appointment-in-progress' ||
                    sourceEvent === 'notification:appointment-completed'
                  ? 'appointment'
                  : 'system';

      this.pushNotification({
        title,
        message,
        type,
        category,
        sourceEvent,
        payload: event
      });
    });
  }

  private buildPrescriptionPatientNotice(event: any): {
    title: string;
    message: string;
    type: AppNotification['type'];
  } {
    if (typeof event?.message === 'string' && event.message.trim()) {
      return {
        title: event?.title || 'Obaveštenje o receptu',
        message: event.message.trim(),
        type: this.mapPrescriptionNoticeType(event?.action)
      };
    }

    const doctor = event?.doctorName || 'Doktor';
    const medName = event?.medicationName || '';
    const diagnosis = event?.medicalRecordDiagnosis || '';
    const action = event?.action || 'created';

    switch (action) {
      case 'created':
        if (event?.hasMedicalRecord || diagnosis) {
          return {
            title: 'Novi recept',
            message: diagnosis
              ? `Doktor ${doctor} je kreirao novi recept na osnovu kartona (dijagnoza: ${diagnosis}).`
              : `Doktor ${doctor} je kreirao novi recept na osnovu kartona.`,
            type: 'success'
          };
        }
        return {
          title: 'Novi recept',
          message: `Doktor ${doctor} je kreirao novi recept za vas.`,
          type: 'success'
        };
      case 'medication_added':
        return {
          title: 'Lek dodat na recept',
          message: medName
            ? `Doktor ${doctor} je dodao lek „${medName}” na vaš recept.`
            : `Doktor ${doctor} je dodao novi lek na vaš recept.`,
          type: 'info'
        };
      case 'medication_cancelled':
        return {
          title: 'Lek otkazan',
          message: medName
            ? `Doktor ${doctor} je otkazao lek „${medName}” na vaš recept.`
            : `Doktor ${doctor} je otkazao lek na vaš recept.`,
          type: 'warning'
        };
      case 'completed':
        return {
          title: 'Recept završen',
          message: `Terapija po receptu doktora ${doctor} je završena.`,
          type: 'success'
        };
      case 'cancelled':
        return {
          title: 'Recept otkazan',
          message: `Doktor ${doctor} je otkazao vaš recept.`,
          type: 'warning'
        };
      default:
        return {
          title: 'Obaveštenje o receptu',
          message: `Doktor ${doctor} je ažurirao vaš recept.`,
          type: 'info'
        };
    }
  }

  private mapPrescriptionNoticeType(action: string | undefined): AppNotification['type'] {
    if (action === 'medication_cancelled' || action === 'cancelled') {
      return 'warning';
    }
    if (action === 'created' || action === 'completed') {
      return 'success';
    }
    return 'info';
  }

  private resolveNotificationType(value: unknown): AppNotification['type'] {
    if (value === 'success' || value === 'warning' || value === 'error' || value === 'info') {
      return value;
    }
    return 'info';
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

  private resolveUserId(value: unknown): string {
    if (!value) {
      return '';
    }
    if (typeof value === 'object' && value !== null && '_id' in value) {
      return String((value as { _id: unknown })._id);
    }
    return String(value);
  }

  private formatCanceledAppointmentDate(value: any): string {
    const date = value ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) {
      return '';
    }

    const datePart = date.toLocaleDateString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const timePart = date.toLocaleTimeString('sr-RS', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    return `${datePart}. u ${timePart}`;
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
    // Odloži toast da izbegnemo NG0100 u layout-u pri socket događajima u istom CD ciklusu.
    setTimeout(() => this.toastSignal.set(notification), 0);
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
