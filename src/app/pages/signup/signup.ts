import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-signup',
  imports: [FormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.css'
})
export class Signup {

  private authService = inject(AuthService);
  private router = inject(Router);

  name = '';
  email = '';
  password = '';
  confirmPassword = '';

  errorMessage = '';
  successMessage = '';
  loading = false;


  async signup(): Promise<void> {

    this.errorMessage = '';
    this.successMessage = '';

    if (!this.name.trim()) {

      this.errorMessage =
        'Please enter your name.';

      return;
    }

    if (!this.email.trim()) {

      this.errorMessage =
        'Please enter your email address.';

      return;
    }

    if (this.password.length < 6) {

      this.errorMessage =
        'Password must be at least 6 characters.';

      return;
    }

    if (this.password !== this.confirmPassword) {

      this.errorMessage =
        'Passwords do not match.';

      return;
    }

    this.loading = true;

    try {

      await this.authService.signup(
        this.email.trim(),
        this.password
      );

      this.successMessage =
        'Account created successfully!';

      await this.router.navigate(['/dashboard']);

    } catch (error: any) {

      switch (error?.code) {

        case 'auth/email-already-in-use':

          this.errorMessage =
            'An account already exists with this email.';

          break;

        case 'auth/invalid-email':

          this.errorMessage =
            'Please enter a valid email address.';

          break;

        case 'auth/weak-password':

          this.errorMessage =
            'Password is too weak. Use at least 6 characters.';

          break;

        default:

          this.errorMessage =
            'Unable to create your account. Please try again.';

      }

    } finally {

      this.loading = false;

    }
  }

}