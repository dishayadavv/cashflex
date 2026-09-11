import { Injectable, inject, signal } from '@angular/core';

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

export interface Transaction {
  id: string;
  title: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  icon: string;
}

@Injectable({
  providedIn: 'root'
})
export class TransactionService {

  private db = getFirestore(firebaseApp);
  private auth = getAuth(firebaseApp);

  private authService = inject(AuthService);

  private transactionsSignal = signal<Transaction[]>([]);

  readonly transactions = this.transactionsSignal.asReadonly();

  async loadTransactions(): Promise<void> {

    console.log('TRANSACTIONS: Starting load...');

    const user = await this.authService.waitForAuthState();

    console.log('TRANSACTIONS: User:', user);

    if (!user) {
      throw new Error('No user is logged in.');
    }

    const transactionsRef = collection(
      this.db,
      'users',
      user.uid,
      'transactions'
    );

    const snapshot = await getDocs(transactionsRef);

    console.log(
      'TRANSACTIONS: Firestore documents:',
      snapshot.size
    );

    const transactions: Transaction[] = snapshot.docs.map(
      (transactionDoc) => {

        const data = transactionDoc.data();

        return {
          id: transactionDoc.id,
          title: String(data['title'] ?? 'Transaction'),
          category: String(data['category'] ?? 'Other'),
          amount: Number(data['amount'] ?? 0),
          type: data['type'] === 'income'
            ? 'income'
            : 'expense',
          date: String(data['date'] ?? 'Unknown date'),
          icon: String(data['icon'] ?? '💰')
        };
      }
    );

    this.transactionsSignal.set(transactions);

    console.log(
      'TRANSACTIONS: Loaded successfully:',
      transactions
    );
  }

  async addTransaction(
    transaction: Omit<Transaction, 'id'>
  ): Promise<void> {

    const user = await this.authService.waitForAuthState();

    if (!user) {
      throw new Error('No user is logged in.');
    }

    const transactionsRef = collection(
      this.db,
      'users',
      user.uid,
      'transactions'
    );

    const documentReference = await addDoc(
      transactionsRef,
      {
        title: transaction.title,
        category: transaction.category,
        amount: transaction.amount,
        type: transaction.type,
        date: transaction.date,
        icon: transaction.icon
      }
    );

    this.transactionsSignal.update(
      transactions => [
        {
          ...transaction,
          id: documentReference.id
        },
        ...transactions
      ]
    );
  }

  async deleteTransaction(id: string): Promise<void> {

    const user = await this.authService.waitForAuthState();

    if (!user) {
      throw new Error('No user is logged in.');
    }

    const transactionRef = doc(
      this.db,
      'users',
      user.uid,
      'transactions',
      id
    );

    await deleteDoc(transactionRef);

    this.transactionsSignal.update(
      transactions =>
        transactions.filter(
          transaction => transaction.id !== id
        )
    );
  }

  getTotalIncome(): number {

    return this.transactionsSignal()
      .filter(transaction => transaction.type === 'income')
      .reduce(
        (total, transaction) =>
          total + transaction.amount,
        0
      );
  }

  getTotalExpenses(): number {

    return this.transactionsSignal()
      .filter(transaction => transaction.type === 'expense')
      .reduce(
        (total, transaction) =>
          total + transaction.amount,
        0
      );
  }

  getBalance(): number {

    return (
      this.getTotalIncome() -
      this.getTotalExpenses()
    );
  }
}