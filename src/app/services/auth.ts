import { Injectable } from '@angular/core';

import {
  Auth,
  User,
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';

import { firebaseApp } from '../firebase.config';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private auth: Auth = getAuth(firebaseApp);

  async signup(email: string, password: string): Promise<User> {
    const credential = await createUserWithEmailAndPassword(
      this.auth,
      email,
      password
    );

    return credential.user;
  }

  async login(email: string, password: string): Promise<User> {
    const credential = await signInWithEmailAndPassword(
      this.auth,
      email,
      password
    );

    return credential.user;
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
  }

  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  listenToAuthChanges(callback: (user: User | null) => void) {
    return onAuthStateChanged(this.auth, callback);
  }

  waitForAuthState(): Promise<User | null> {
    return new Promise((resolve) => {

      const unsubscribe = onAuthStateChanged(
        this.auth,
        (user) => {
          unsubscribe();
          resolve(user);
        },
        () => {
          unsubscribe();
          resolve(null);
        }
      );

    });
  }
}