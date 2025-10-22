// Push notifications and reminders
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export interface Reminder {
  id: string;
  leadId: string;
  title: string;
  message: string;
  dateTime: Date;
}

class NotificationService {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (!Capacitor.isNativePlatform() || this.isInitialized) return;

    try {
      // Request permissions
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.warn('Push notification permission not granted');
        return;
      }

      await PushNotifications.register();

      // Listen for notifications
      PushNotifications.addListener('registration', (token) => {
        console.log('Push registration success, token: ' + token.value);
      });

      PushNotifications.addListener('registrationError', (error) => {
        console.error('Error on registration: ' + JSON.stringify(error));
      });

      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push notification received: ', notification);
      });

      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('Push notification action performed', notification);
      });

      // Local notifications permission
      await LocalNotifications.requestPermissions();

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  }

  async scheduleReminder(reminder: Reminder): Promise<void> {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: parseInt(reminder.id.replace(/\D/g, '').substring(0, 9)) || Math.floor(Math.random() * 1000000),
            title: reminder.title,
            body: reminder.message,
            schedule: { at: reminder.dateTime },
            sound: undefined,
            attachments: undefined,
            actionTypeId: '',
            extra: { leadId: reminder.leadId }
          }
        ]
      });
    } catch (error) {
      console.error('Failed to schedule reminder:', error);
    }
  }

  async sendLocalNotification(title: string, body: string, extra?: any): Promise<void> {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Math.floor(Math.random() * 1000000),
            title,
            body,
            schedule: { at: new Date(Date.now() + 1000) },
            sound: undefined,
            attachments: undefined,
            actionTypeId: '',
            extra
          }
        ]
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  async cancelReminder(id: string): Promise<void> {
    try {
      const notificationId = parseInt(id.replace(/\D/g, '').substring(0, 9)) || 0;
      await LocalNotifications.cancel({ notifications: [{ id: notificationId }] });
    } catch (error) {
      console.error('Failed to cancel reminder:', error);
    }
  }
}

export const notificationService = new NotificationService();
