import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';

  errorMessage = '';
  loading = false;

  async login(): Promise<void> {

    this.errorMessage = '';

    if (!this.email.trim() || !this.password) {
      this.errorMessage = 'Please enter your email and password.';
      return;
    }

    this.loading = true;

    try {

      await this.authService.login(
        this.email.trim(),
        this.password
      );

      await this.router.navigate(['/dashboard']);

    } catch (error: any) {

      switch (error?.code) {

        case 'auth/invalid-credential':
          this.errorMessage =
            'Incorrect email or password.';
          break;

        case 'auth/user-not-found':
          this.errorMessage =
            'No account was found with this email.';
          break;

        case 'auth/wrong-password':
          this.errorMessage =
            'Incorrect password.';
          break;

        case 'auth/invalid-email':
          this.errorMessage =
            'Please enter a valid email address.';
          break;

        case 'auth/too-many-requests':
          this.errorMessage =
            'Too many attempts. Please try again later.';
          break;

        default:
          this.errorMessage =
            'Unable to sign in. Please try again.';
      }

    } finally {

      this.loading = false;

    }
  }

}