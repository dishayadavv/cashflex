import { Injectable, inject } from '@angular/core';

import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  getFirestore
} from 'firebase/firestore';

import { getAuth } from 'firebase/auth';

import { firebaseApp } from '../firebase.config';
import { AuthService } from './auth';

export interface BudgetItem {
  id: string;
  category: string;
  icon: string;
  limit: number;
  spent: number;
}

@Injectable({
  providedIn: 'root'
})
export class BudgetService {

  private db = getFirestore(firebaseApp);
  private auth = getAuth(firebaseApp);

  private authService = inject(AuthService);

  async getBudgets(): Promise<BudgetItem[]> {

    console.log('BUDGET: Starting getBudgets()');

    console.log(
      'BUDGET: Current Firebase user:',
      this.auth.currentUser
    );

    const user = await Promise.race([
      this.authService.waitForAuthState(),

      new Promise<null>((_, reject) =>
        setTimeout(
          () => reject(new Error('Authentication timed out after 10 seconds')),
          10000
        )
      )
    ]);

    console.log('BUDGET: Auth completed:', user);

    if (!user) {
      throw new Error('No user is logged in.');
    }

    console.log('BUDGET: Getting Firestore budgets...');

    const budgetsRef = collection(
      this.db,
      'users',
      user.uid,
      'budgets'
    );

    const snapshot = await Promise.race([
      getDocs(budgetsRef),

      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Firestore timed out after 10 seconds')),
          10000
        )
      )
    ]);

    console.log(
      'BUDGET: Firestore completed. Documents:',
      snapshot.size
    );

    return snapshot.docs.map((budgetDoc) => {

      const data = budgetDoc.data();

      return {
        id: budgetDoc.id,
        category: String(data['category'] ?? 'Other'),
        icon: String(data['icon'] ?? '◦'),
        limit: Number(data['limit'] ?? 0),
        spent: Number(data['spent'] ?? 0)
      };

    });
  }

  async addBudget(
    category: string,
    icon: string,
    limit: number
  ): Promise<void> {

    const user = await this.authService.waitForAuthState();

    if (!user) {
      throw new Error('No user is logged in.');
    }

    const budgetsRef = collection(
      this.db,
      'users',
      user.uid,
      'budgets'
    );

    await addDoc(budgetsRef, {
      category,
      icon,
      limit,
      spent: 0
    });
  }

  async deleteBudget(budgetId: string): Promise<void> {

    const user = await this.authService.waitForAuthState();

    if (!user) {
      throw new Error('No user is logged in.');
    }

    const budgetRef = doc(
      this.db,
      'users',
      user.uid,
      'budgets',
      budgetId
    );

    await deleteDoc(budgetRef);
  }
}