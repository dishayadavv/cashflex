import {
  Component,
  OnInit,
  ChangeDetectorRef,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TransactionService, Transaction } from '../../services/transaction';
import { CurrencyService } from '../../services/currency';


@Component({
  selector: 'app-transactions',

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl: './transactions.html',

  styleUrl: './transactions.css'
})
export class Transactions implements OnInit {

  private transactionService =
    inject(TransactionService);

  private currencyService =
    inject(CurrencyService);

  private cdr =
    inject(ChangeDetectorRef);


  transactions =
    this.transactionService.transactions;


  loading = true;

  errorMessage = '';


  searchText = '';

  selectedType = 'All';

  selectedCategory = 'All';


  showAddTransaction = false;


  transactionType:
    'income' | 'expense' = 'expense';


  newTransaction = {

    title: '',

    category: 'Food',

    amount: 0

  };


  // ==========================================
  // INITIALIZE
  // ==========================================

  ngOnInit(): void {

    this.loadTransactions();

  }


  // ==========================================
  // LOAD TRANSACTIONS
  // ==========================================

  async loadTransactions(): Promise<void> {

    this.loading = true;

    this.errorMessage = '';


    try {

      await Promise.all([

        this.transactionService.loadTransactions(),

        this.currencyService.loadCurrency()

      ]);

    } catch (error) {

      console.error(
        'TRANSACTIONS PAGE: Loading error:',
        error
      );

      this.errorMessage =
        'Unable to load your transactions. Please try again.';

    } finally {

      this.loading = false;

      this.cdr.detectChanges();

    }

  }


  // ==========================================
  // CURRENCY
  // ==========================================

  get currencySymbol(): string {

    return this.currencyService.getSymbol();

  }


  get currencyRate(): number {

    return this.currencyService.getRate();

  }


  convertAmount(
    amount: number
  ): number {

    return this.currencyService.convert(
      amount
    );

  }


  // ==========================================
  // SUMMARY
  // ==========================================

  get totalIncome(): number {

    return this.transactionService.getTotalIncome();

  }


  get totalExpenses(): number {

    return this.transactionService.getTotalExpenses();

  }


  get balance(): number {

    return this.transactionService.getBalance();

  }


  get displayTotalIncome(): number {

    return this.convertAmount(
      this.totalIncome
    );

  }


  get displayTotalExpenses(): number {

    return this.convertAmount(
      this.totalExpenses
    );

  }


  get displayBalance(): number {

    return this.convertAmount(
      this.balance
    );

  }


  // ==========================================
  // FILTERED TRANSACTIONS
  // ==========================================

  get filteredTransactions(): Transaction[] {

    return this.transactions().filter(
      (transaction) => {

        const search =
          this.searchText
            .toLowerCase()
            .trim();


        const matchesSearch =
          transaction.title
            .toLowerCase()
            .includes(search)

          ||

          transaction.category
            .toLowerCase()
            .includes(search);


        const matchesType =
          this.selectedType === 'All'

          ||

          transaction.type ===
            this.selectedType.toLowerCase();


        const matchesCategory =
          this.selectedCategory === 'All'

          ||

          transaction.category ===
            this.selectedCategory;


        return (
          matchesSearch &&
          matchesType &&
          matchesCategory
        );

      }
    );

  }


  // ==========================================
  // OPEN ADD TRANSACTION
  // ==========================================

  openAddTransaction(
    type:
      'income' | 'expense' = 'expense'
  ): void {

    this.transactionType = type;


    this.newTransaction = {

      title: '',

      category:
        type === 'income'
          ? 'Salary'
          : 'Food',

      amount: 0

    };


    this.showAddTransaction = true;


    this.cdr.detectChanges();

  }


  // ==========================================
  // CLOSE ADD TRANSACTION
  // ==========================================

  closeAddTransaction(): void {

    this.showAddTransaction = false;

    this.cdr.detectChanges();

  }


  // ==========================================
  // ADD TRANSACTION
  // ==========================================

  async addTransaction(): Promise<void> {

    if (
      !this.newTransaction.title.trim() ||

      this.newTransaction.amount <= 0
    ) {

      return;

    }


    const icons: {
      [key: string]: string
    } = {

      Food: '🍔',

      Transport: '🚕',

      Shopping: '🛍️',

      Salary: '💼',

      Bills: '📄',

      Entertainment: '🎬',

      Health: '💊',

      Other: '💰'

    };


    try {

      /*
       * The user enters the amount
       * in the currently selected currency.
       *
       * Firebase stores the amount in INR.
       */

      const amountInINR =
        Number(
          this.newTransaction.amount
        ) /
        this.currencyRate;


      await this.transactionService.addTransaction({

        title:
          this.newTransaction.title.trim(),

        category:
          this.newTransaction.category,

        amount:
          Number(amountInINR),

        type:
          this.transactionType,

        date:
          'Just now',

        icon:
          icons[
            this.newTransaction.category
          ] || '💰'

      });


      this.closeAddTransaction();


      this.cdr.detectChanges();

    } catch (error) {

      console.error(
        'TRANSACTIONS PAGE: Add error:',
        error
      );

      this.errorMessage =
        'Unable to add this transaction. Please try again.';

      this.cdr.detectChanges();

    }

  }


  // ==========================================
  // DELETE TRANSACTION
  // ==========================================

  async deleteTransaction(
    id: string
  ): Promise<void> {

    try {

      await this.transactionService
        .deleteTransaction(id);


      this.cdr.detectChanges();

    } catch (error) {

      console.error(
        'TRANSACTIONS PAGE: Delete error:',
        error
      );

      this.errorMessage =
        'Unable to delete this transaction. Please try again.';

      this.cdr.detectChanges();

    }

  }

}