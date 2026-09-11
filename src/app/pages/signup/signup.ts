import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth';

import { doc, getFirestore, setDoc } from 'firebase/firestore';
import { firebaseApp } from '../../firebase.config';

@Component({
  selector: 'app-signup',
  imports: [FormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.css'
})
export class Signup {
  private authService = inject(AuthService);
  private router = inject(Router);

  private db = getFirestore(firebaseApp);

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

    const name = this.name.trim();
    const email = this.email.trim();

    if (!name) {
      this.errorMessage = 'Please enter your name.';
      return;
    }

    if (!email) {
      this.errorMessage = 'Please enter your email address.';
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    this.loading = true;

    try {
      // Create Firebase Authentication account
      const user = await this.authService.signup(
        email,
        this.password
      );

      // Save the user's name and email in Firestore
      await setDoc(
        doc(
          this.db,
          'users',
          user.uid,
          'profile',
          'settings'
        ),
        {
          name: name,
          email: email
        },
        {
          merge: true
        }
      );

      this.successMessage = 'Account created successfully!';

      // Go to dashboard
      await this.router.navigate(['/dashboard']);

    } catch (error: any) {
      console.error('SIGNUP ERROR:', error);

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