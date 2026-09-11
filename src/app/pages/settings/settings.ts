import {
  Component,
  OnInit,
  ChangeDetectorRef,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  SettingsService,
  UserSettings
} from '../../services/settings';

import {
  CurrencyService
} from '../../services/currency';

import {
  getFirestore,
  collection,
  getDocs
} from 'firebase/firestore';

import {
  getAuth
} from 'firebase/auth';

import {
  firebaseApp
} from '../../firebase.config';


@Component({
  selector: 'app-settings',

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl: './settings.html',

  styleUrl: './settings.css'
})
export class Settings implements OnInit {

  // ==========================================
  // SERVICES
  // ==========================================

  private settingsService =
    inject(SettingsService);

  private currencyService =
    inject(CurrencyService);

  private cdr =
    inject(ChangeDetectorRef);

  private firestore =
    getFirestore(firebaseApp);

  private auth =
    getAuth(firebaseApp);


  // ==========================================
  // SETTINGS DATA
  // ==========================================

  name = 'User';

  email = '';

  currency = 'INR';

  monthlyBudget = 20000;

  notifications = true;

  budgetAlerts = true;

  weeklySummary = true;


  // ==========================================
  // UI STATE
  // ==========================================

  loading = true;

  saving = false;

  exporting = false;

  successMessage = '';

  showSavedMessage = false;

  errorMessage = '';


  // ==========================================
  // CURRENCY SYMBOL
  // ==========================================

  get currencySymbol(): string {

    return this.currencyService.getSymbol();

  }


  // ==========================================
  // CURRENCY RATE
  // ==========================================

  get currencyRate(): number {

    return this.currencyService.getRate();

  }


  // ==========================================
  // INITIALIZE
  // ==========================================

  ngOnInit(): void {

    this.loadSettings();

  }


  // ==========================================
  // LOAD SETTINGS
  // ==========================================

  async loadSettings(): Promise<void> {

    this.loading = true;

    this.errorMessage = '';

    try {

      console.log(
        'SETTINGS PAGE: Loading...'
      );


      const settings =
        await this.settingsService.getSettings();


      this.name =
        settings.name || 'User';


      this.email =
        settings.email || '';


      this.currency =
        settings.currency || 'INR';


      const storedBudgetINR =
        Number(
          settings.monthlyBudget
        ) || 0;


      await this.currencyService
        .setCurrency(this.currency);


      this.monthlyBudget =
        this.currencyService.convert(
          storedBudgetINR
        );


      this.notifications =
        settings.notifications ?? true;


      this.budgetAlerts =
        settings.budgetAlerts ?? true;


      this.weeklySummary =
        settings.weeklySummary ?? true;


      console.log(
        'SETTINGS PAGE: Loaded:',
        settings
      );


      console.log(
        'SETTINGS PAGE: Display budget:',
        this.monthlyBudget
      );


    } catch (error) {

      console.error(
        'SETTINGS PAGE: Loading error:',
        error
      );


      this.errorMessage =
        'Unable to load your settings. Please try again.';

    } finally {

      this.loading = false;

      this.cdr.detectChanges();

    }

  }


  // ==========================================
  // SAVE SETTINGS
  // ==========================================

  async saveSettings(): Promise<void> {

    if (!this.name.trim()) {

      this.errorMessage =
        'Please enter your name.';

      return;

    }


    this.saving = true;

    this.successMessage = '';

    this.showSavedMessage = false;

    this.errorMessage = '';


    try {

      await this.currencyService
        .setCurrency(this.currency);


      const rate =
        this.currencyService.getRate();


      let monthlyBudgetINR = 0;


      if (rate > 0) {

        monthlyBudgetINR =
          Number(this.monthlyBudget) /
          rate;

      }


      const settings: UserSettings = {

        name:
          this.name.trim(),

        email:
          this.email.trim(),

        currency:
          this.currency,

        monthlyBudget:
          Number(monthlyBudgetINR),

        notifications:
          this.notifications,

        budgetAlerts:
          this.budgetAlerts,

        weeklySummary:
          this.weeklySummary

      };


      await this.settingsService
        .saveSettings(settings);


      this.successMessage =
        'Settings saved successfully.';


      this.showSavedMessage = true;


      console.log(
        'SETTINGS PAGE: Saved:',
        settings
      );


      setTimeout(() => {

        this.showSavedMessage = false;

        this.cdr.detectChanges();

      }, 3000);


    } catch (error) {

      console.error(
        'SETTINGS PAGE: Save error:',
        error
      );


      this.errorMessage =
        'Unable to save your settings. Please try again.';

    } finally {

      this.saving = false;

      this.cdr.detectChanges();

    }

  }


  // ==========================================
  // EXPORT DATA
  // ==========================================

  async exportData(): Promise<void> {

    if (this.exporting) {

      return;

    }


    const user =
      this.auth.currentUser;


    if (!user) {

      this.errorMessage =
        'Please log in before exporting your data.';

      return;

    }


    this.exporting = true;

    this.errorMessage = '';

    this.successMessage = '';

    this.showSavedMessage = false;


    try {

      console.log(
        'EXPORT: Starting data export...'
      );


      // ==========================================
      // TRANSACTIONS
      // ==========================================

      const transactionsRef =
        collection(
          this.firestore,
          'users',
          user.uid,
          'transactions'
        );


      const transactionsSnapshot =
        await getDocs(
          transactionsRef
        );


      const transactions =
        transactionsSnapshot.docs.map(
          document => ({

            id:
              document.id,

            ...document.data()

          })
        );


      // ==========================================
      // BUDGETS
      // ==========================================

      const budgetsRef =
        collection(
          this.firestore,
          'users',
          user.uid,
          'budgets'
        );


      const budgetsSnapshot =
        await getDocs(
          budgetsRef
        );


      const budgets =
        budgetsSnapshot.docs.map(
          document => ({

            id:
              document.id,

            ...document.data()

          })
        );


      // ==========================================
      // GOALS
      // ==========================================

      const goalsRef =
        collection(
          this.firestore,
          'users',
          user.uid,
          'goals'
        );


      const goalsSnapshot =
        await getDocs(
          goalsRef
        );


      const goals =
        goalsSnapshot.docs.map(
          document => ({

            id:
              document.id,

            ...document.data()

          })
        );


      // ==========================================
      // SETTINGS
      // ==========================================

      const settings =
        await this.settingsService
          .getSettings();


      // ==========================================
      // CREATE EXPORT DATA
      // ==========================================

      const exportData = {

        application:
          'CashFlex',

        version:
          '1.0',

        exportDate:
          new Date().toISOString(),

        account: {

          name:
            settings.name || this.name,

          email:
            settings.email || this.email,

          currency:
            settings.currency || this.currency,

          monthlyBudget:
            Number(
              settings.monthlyBudget
            ) || 0

        },

        preferences: {

          notifications:
            settings.notifications ?? true,

          budgetAlerts:
            settings.budgetAlerts ?? true,

          weeklySummary:
            settings.weeklySummary ?? true

        },

        transactions,

        budgets,

        goals

      };


      // ==========================================
      // CONVERT TO JSON
      // ==========================================

      const json =
        JSON.stringify(
          exportData,
          null,
          2
        );


      // ==========================================
      // CREATE FILE
      // ==========================================

      const blob =
        new Blob(
          [json],
          {
            type:
              'application/json'
          }
        );


      const url =
        URL.createObjectURL(
          blob
        );


      const link =
        document.createElement(
          'a'
        );


      const today =
        new Date()
          .toISOString()
          .split('T')[0];


      link.href =
        url;


      link.download =
        `cashflex-data-${today}.json`;


      document.body.appendChild(
        link
      );


      link.click();


      document.body.removeChild(
        link
      );


      URL.revokeObjectURL(
        url
      );


      console.log(
        'EXPORT: Data exported successfully.'
      );


      this.successMessage =
        'Your CashFlex data has been exported.';


      this.showSavedMessage = true;


      setTimeout(() => {

        this.showSavedMessage = false;

        this.cdr.detectChanges();

      }, 4000);


    } catch (error) {

      console.error(
        'EXPORT: Error:',
        error
      );


      this.errorMessage =
        'Unable to export your data. Please try again.';

    } finally {

      this.exporting = false;

      this.cdr.detectChanges();

    }

  }


  // ==========================================
  // RESET SETTINGS
  // ==========================================

  async resetSettings(): Promise<void> {

    await this.loadSettings();

  }

}