import {
  Component,
  inject,
  OnInit,
  ChangeDetectorRef,
  HostListener
} from '@angular/core';

import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';

import { AuthService } from './services/auth';
import { SettingsService } from './services/settings';


@Component({
  selector: 'app-root',

  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet
  ],

  templateUrl: './app.html',

  styleUrl: './app.css'
})
export class App implements OnInit {

  // ==========================================
  // SERVICES
  // ==========================================

  private authService =
    inject(AuthService);

  private router =
    inject(Router);

  private settingsService =
    inject(SettingsService);

  private cdr =
    inject(ChangeDetectorRef);


  // ==========================================
  // USER
  // ==========================================

  userName = 'Disha';

  userEmail = '';


  // ==========================================
  // ACCOUNT MENU
  // ==========================================

  accountMenuOpen = false;

  loggingOut = false;


  // ==========================================
  // INITIALIZE
  // ==========================================

  ngOnInit(): void {

    this.loadUserName();

  }


  // ==========================================
  // LOAD USER INFORMATION
  // ==========================================

  async loadUserName(): Promise<void> {

    try {

      const settings =
        await this.settingsService.getSettings();


      if (settings.name?.trim()) {

        this.userName =
          settings.name.trim();

      }


      if (settings.email?.trim()) {

        this.userEmail =
          settings.email.trim();

      }


      // If email isn't saved in settings,
      // get it directly from Firebase Auth.

      if (!this.userEmail) {

        const user =
          this.authService.getCurrentUser();


        if (user?.email) {

          this.userEmail =
            user.email;

        }

      }


    } catch (error) {

      console.error(
        'APP: Unable to load user information:',
        error
      );


      // Still try Firebase Auth

      const user =
        this.authService.getCurrentUser();


      if (user?.email) {

        this.userEmail =
          user.email;

      }

    } finally {

      this.cdr.detectChanges();

    }

  }


  // ==========================================
  // AUTH PAGE CHECK
  // ==========================================

  isAuthPage(): boolean {

    const url =
      this.router.url;


    return (

      url.startsWith('/login') ||

      url.startsWith('/signup')

    );

  }


  // ==========================================
  // TOGGLE ACCOUNT MENU
  // ==========================================

  toggleAccountMenu(): void {

    this.accountMenuOpen =
      !this.accountMenuOpen;

  }


  // ==========================================
  // CLOSE ACCOUNT MENU
  // ==========================================

  closeAccountMenu(): void {

    this.accountMenuOpen = false;

  }


  // ==========================================
  // GO TO SETTINGS
  // ==========================================

  openSettings(): void {

    this.accountMenuOpen = false;

    this.router.navigate([
      '/settings'
    ]);

  }


  // ==========================================
  // LOGOUT
  // ==========================================

  async logout(): Promise<void> {

    if (this.loggingOut) {

      return;

    }


    this.loggingOut = true;

    this.accountMenuOpen = false;


    try {

      await this.authService.logout();


      console.log(
        'APP: User logged out successfully.'
      );


      await this.router.navigate([
        '/login'
      ]);


    } catch (error) {

      console.error(
        'APP: Logout error:',
        error
      );


    } finally {

      this.loggingOut = false;

      this.cdr.detectChanges();

    }

  }


  // ==========================================
  // CLOSE MENU WHEN CLICKING OUTSIDE
  // ==========================================

  @HostListener(
    'document:click',
    ['$event']
  )
  onDocumentClick(
    event: MouseEvent
  ): void {

    const target =
      event.target as HTMLElement;


    if (
      !target.closest(
        '.profile-section'
      )
    ) {

      this.accountMenuOpen =
        false;

    }

  }

}