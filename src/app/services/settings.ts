import { Injectable, inject } from '@angular/core';
import {
  doc,
  getDoc,
  setDoc,
  getFirestore
} from 'firebase/firestore';

import { firebaseApp } from '../firebase.config';
import { AuthService } from './auth';

export interface UserSettings {
  name: string;
  email: string;
  currency: string;
  monthlyBudget: number;
  notifications: boolean;
  budgetAlerts: boolean;
  weeklySummary: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {

  private db = getFirestore(firebaseApp);
  private authService = inject(AuthService);

  async getSettings(): Promise<UserSettings> {

    console.log('SETTINGS: Starting load...');

    const user = await this.authService.waitForAuthState();

    console.log('SETTINGS: User:', user);

    if (!user) {
      throw new Error('No user is logged in.');
    }

    const settingsRef = doc(
      this.db,
      'users',
      user.uid,
      'profile',
      'settings'
    );

    const snapshot = await getDoc(settingsRef);

    /*
     * If the settings document does not exist,
     * create it with neutral defaults.
     *
     * IMPORTANT:
     * Never use as a default name.
     */
    if (!snapshot.exists()) {

      const defaultSettings: UserSettings = {
        name: 'User',
        email: user.email ?? '',
        currency: 'INR',
        monthlyBudget: 20000,
        notifications: true,
        budgetAlerts: true,
        weeklySummary: true
      };

      await setDoc(
        settingsRef,
        defaultSettings
      );

      console.log('SETTINGS: Default settings created.');

      return defaultSettings;
    }

    const data = snapshot.data();

    return {
      name: String(data['name'] ?? 'User'),
      email: String(data['email'] ?? user.email ?? ''),
      currency: String(data['currency'] ?? 'INR'),
      monthlyBudget: Number(data['monthlyBudget'] ?? 20000),
      notifications: Boolean(data['notifications'] ?? true),
      budgetAlerts: Boolean(data['budgetAlerts'] ?? true),
      weeklySummary: Boolean(data['weeklySummary'] ?? true)
    };
  }


  async saveSettings(settings: UserSettings): Promise<void> {

    console.log('SETTINGS: Starting save...');

    const user = await this.authService.waitForAuthState();

    console.log('SETTINGS: Save user:', user);

    if (!user) {
      throw new Error('No user is logged in.');
    }

    const settingsRef = doc(
      this.db,
      'users',
      user.uid,
      'profile',
      'settings'
    );

    console.log(
      'SETTINGS: Saving to:',
      settingsRef.path
    );

    await setDoc(
      settingsRef,
      {
        name: settings.name,
        email: settings.email,
        currency: settings.currency,
        monthlyBudget: Number(settings.monthlyBudget),
        notifications: settings.notifications,
        budgetAlerts: settings.budgetAlerts,
        weeklySummary: settings.weeklySummary
      },
      {
        merge: true
      }
    );

    console.log('SETTINGS: Saved successfully.');
  }
}