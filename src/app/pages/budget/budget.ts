import {
  Component,
  OnInit,
  ChangeDetectorRef,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  BudgetService,
  BudgetItem
} from '../../services/budget';

import {
  TransactionService,
  Transaction
} from '../../services/transaction';

import {
  CurrencyService
} from '../../services/currency';


@Component({
  selector: 'app-budget',

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl: './budget.html',

  styleUrl: './budget.css'
})


export class Budget implements OnInit {

  private budgetService =
    inject(BudgetService);

  private transactionService =
    inject(TransactionService);

  private currencyService =
    inject(CurrencyService);

  private cdr =
    inject(ChangeDetectorRef);


  /* =========================
     BUDGET DATA
  ========================= */

  budgets: BudgetItem[] = [];

  loading = true;

  errorMessage = '';


  /* =========================
     ADD BUDGET MODAL
  ========================= */

  showAddBudget = false;

  newBudget = {

    category: 'Food',

    limit: 0

  };


  /* =========================
     INITIAL LOAD
  ========================= */

  ngOnInit(): void {

    this.loadBudgets();

  }


  /* =========================
     LOAD BUDGETS
  ========================= */

  async loadBudgets(): Promise<void> {

    this.loading = true;

    this.errorMessage = '';

    try {

      /*
       * Load currency first so
       * displayed values use the
       * correct exchange rate.
       */

      await this.currencyService
        .loadCurrency();


      /* Load budgets */

      const budgets =
        await this.budgetService
          .getBudgets();


      /* Load transactions */

      await this.transactionService
        .loadTransactions();


      /*
       * Get transactions from
       * TransactionService.
       */

      const transactions: Transaction[] =
        this.transactionService
          .transactions();


      /*
       * Calculate actual spending
       * for each budget category.
       */

      this.budgets =
        budgets.map(
          (budget: BudgetItem) => {

            const spent =
              transactions
                .filter(
                  (transaction: Transaction) =>
                    transaction.type === 'expense' &&
                    transaction.category ===
                      budget.category
                )
                .reduce(
                  (
                    total: number,
                    transaction: Transaction
                  ) =>
                    total + transaction.amount,
                  0
                );


            return {

              ...budget,

              /*
               * IMPORTANT:
               * spent stays in INR.
               */

              spent

            };

          }
        );


    } catch (error) {

      console.error(
        'BUDGET PAGE: Loading error:',
        error
      );

      this.errorMessage =
        'Unable to load your budgets. Please try again.';

    } finally {

      this.loading = false;

      this.cdr.detectChanges();

    }

  }


  /* =========================
     CURRENCY
  ========================= */

  get currencySymbol(): string {

    return this.currencyService
      .getSymbol();

  }


  get currencyRate(): number {

    return this.currencyService
      .getRate();

  }


  get currencyLoading(): boolean {

    return this.currencyService
      .loading();

  }


  /*
   * Convert INR amount into
   * currently selected currency.
   */

  convertAmount(
    amount: number
  ): number {

    return this.currencyService
      .convert(amount);

  }


  /* =========================
     TOTAL BUDGET
  ========================= */

  get totalBudget(): number {

    return this.budgets.reduce(
      (
        total: number,
        budget: BudgetItem
      ) =>
        total + budget.limit,
      0
    );

  }


  /*
   * Total budget in selected
   * display currency.
   */

  get displayTotalBudget(): number {

    return this.convertAmount(
      this.totalBudget
    );

  }


  /* =========================
     TOTAL SPENT
  ========================= */

  get totalSpent(): number {

    return this.budgets.reduce(
      (
        total: number,
        budget: BudgetItem
      ) =>
        total + budget.spent,
      0
    );

  }


  /*
   * Total spending in selected
   * display currency.
   */

  get displayTotalSpent(): number {

    return this.convertAmount(
      this.totalSpent
    );

  }


  /* =========================
     REMAINING BUDGET
  ========================= */

  get remainingBudget(): number {

    return Math.max(
      this.totalBudget -
      this.totalSpent,
      0
    );

  }


  /*
   * Remaining budget in selected
   * display currency.
   */

  get displayRemainingBudget(): number {

    return this.convertAmount(
      this.remainingBudget
    );

  }


  /* =========================
     USAGE PERCENTAGE
  ========================= */

  get usagePercentage(): number {

    if (this.totalBudget <= 0) {

      return 0;

    }

    return Math.round(
      (
        this.totalSpent /
        this.totalBudget
      ) * 100
    );

  }


  /* =========================
     OPEN ADD BUDGET
  ========================= */

  openAddBudget(): void {

    this.newBudget = {

      category: 'Food',

      limit: 0

    };

    this.showAddBudget = true;

  }


  /* =========================
     CLOSE ADD BUDGET
  ========================= */

  closeAddBudget(): void {

    this.showAddBudget = false;

  }


  /* =========================
     ADD BUDGET
  ========================= */

  async addBudget(): Promise<void> {

    if (
      !this.newBudget.category ||
      this.newBudget.limit <= 0
    ) {

      return;

    }


    const icons: {
      [key: string]: string
    } = {

      Food: '🍔',

      Transport: '🚕',

      Shopping: '🛍️',

      Entertainment: '🎬',

      Bills: '📄',

      Health: '💊',

      Other: '◦'

    };


    try {

      /*
       * The user enters the amount
       * in the currently selected
       * currency.
       *
       * Firebase stores everything
       * in INR.
       *
       * Therefore:
       *
       * selected currency → INR
       */

      const amountInINR =
        this.newBudget.limit /
        this.currencyRate;


      await this.budgetService.addBudget(

        this.newBudget.category,

        icons[
          this.newBudget.category
        ] || '◦',

        Number(amountInINR)

      );


      this.closeAddBudget();


      await this.loadBudgets();


    } catch (error) {

      console.error(
        'BUDGET PAGE: Add error:',
        error
      );

      this.errorMessage =
        'Unable to add this budget. Please try again.';

      this.cdr.detectChanges();

    }

  }


  /* =========================
     DELETE BUDGET
  ========================= */

  async deleteBudget(
    budgetId: string
  ): Promise<void> {

    try {

      await this.budgetService
        .deleteBudget(budgetId);


      await this.loadBudgets();


    } catch (error) {

      console.error(
        'BUDGET PAGE: Delete error:',
        error
      );

      this.errorMessage =
        'Unable to delete this budget. Please try again.';

      this.cdr.detectChanges();

    }

  }


  /* =========================
     REMAINING FOR CATEGORY
  ========================= */

  getRemaining(
    budget: BudgetItem
  ): number {

    return Math.max(
      budget.limit -
      budget.spent,
      0
    );

  }


  /*
   * Remaining amount converted
   * to selected currency.
   */

  getDisplayRemaining(
    budget: BudgetItem
  ): number {

    return this.convertAmount(
      this.getRemaining(budget)
    );

  }


  /* =========================
     DISPLAY BUDGET LIMIT
  ========================= */

  getDisplayLimit(
    budget: BudgetItem
  ): number {

    return this.convertAmount(
      budget.limit
    );

  }


  /* =========================
     DISPLAY SPENT
  ========================= */

  getDisplaySpent(
    budget: BudgetItem
  ): number {

    return this.convertAmount(
      budget.spent
    );

  }


  /* =========================
     CATEGORY PERCENTAGE
  ========================= */

  getPercentage(
    budget: BudgetItem
  ): number {

    if (budget.limit <= 0) {

      return 0;

    }

    return Math.round(
      (
        budget.spent /
        budget.limit
      ) * 100
    );

  }


  /* =========================
     PROGRESS BAR WIDTH
  ========================= */

  getProgressWidth(
    budget: BudgetItem
  ): number {

    return Math.min(
      this.getPercentage(budget),
      100
    );

  }


  /* =========================
     OVER BUDGET CHECK
  ========================= */

  isOverBudget(
    budget: BudgetItem
  ): boolean {

    return budget.spent >
      budget.limit;

  }

}