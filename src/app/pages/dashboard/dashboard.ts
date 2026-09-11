import {
  Component,
  OnInit,
  ChangeDetectorRef,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import {
  TransactionService,
  Transaction
} from '../../services/transaction';

import { SettingsService } from '../../services/settings';
import { CurrencyService } from '../../services/currency';


@Component({
  selector: 'app-dashboard',

  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],

  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {

  private transactionService = inject(TransactionService);
  private settingsService = inject(SettingsService);
  private currencyService = inject(CurrencyService);
  private cdr = inject(ChangeDetectorRef);


  // =====================================================
  // USER
  // =====================================================

  userName = 'Disha';


  // =====================================================
  // TRANSACTIONS
  // =====================================================

  transactions =
    this.transactionService.transactions;


  // =====================================================
  // PAGE STATE
  // =====================================================

  loading = true;
  errorMessage = '';


  // =====================================================
  // BUDGET SETTINGS
  // =====================================================

  monthlyBudget = 0;
  budgetAlerts = true;


  // =====================================================
  // NOTIFICATIONS
  // =====================================================

  notificationsEnabledSetting = true;
  notificationOpen = false;


  // =====================================================
  // ADD TRANSACTION
  // =====================================================

  showAddTransaction = false;

  transactionType:
    'income' | 'expense' = 'expense';

  newTransaction = {
    title: '',
    category: 'Food',
    amount: 0
  };


  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {
    this.loadDashboard();
  }


  // =====================================================
  // LOAD DASHBOARD
  // =====================================================

  async loadDashboard(): Promise<void> {

    this.loading = true;
    this.errorMessage = '';

    try {

      await Promise.all([
        this.transactionService.loadTransactions(),
        this.currencyService.loadCurrency()
      ]);

      const settings =
        await this.settingsService.getSettings();

      this.monthlyBudget =
        Number(settings.monthlyBudget || 0);

      this.budgetAlerts =
        settings.budgetAlerts !== false;

      this.notificationsEnabledSetting =
        settings.notifications !== false;

      if (settings.name?.trim()) {
        this.userName = settings.name.trim();
      }

    } catch (error) {

      console.error(
        'DASHBOARD: Loading error:',
        error
      );

      this.errorMessage =
        'Unable to load your dashboard. Please try again.';

    } finally {

      this.loading = false;
      this.cdr.detectChanges();

    }
  }


  // =====================================================
  // CURRENCY
  // =====================================================

  get currencySymbol(): string {
    return this.currencyService.getSymbol();
  }

  get currencyRate(): number {
    return this.currencyService.getRate();
  }

  convertAmount(amount: number): number {
    return this.currencyService.convert(amount);
  }


  // =====================================================
  // TOTAL INCOME
  // =====================================================

  get totalIncome(): number {

    return this.transactionService
      .getTotalIncome();

  }


  // =====================================================
  // TOTAL EXPENSES
  // =====================================================

  get totalExpenses(): number {

    return this.transactionService
      .getTotalExpenses();

  }


  // =====================================================
  // BALANCE
  // =====================================================

  get balance(): number {

    return this.transactionService
      .getBalance();

  }


  // =====================================================
  // SAVINGS
  // =====================================================

  get savings(): number {

    return Math.max(
      this.totalIncome - this.totalExpenses,
      0
    );

  }


  get savingsPercentage(): number {

    if (this.totalIncome <= 0) {
      return 0;
    }

    return Math.max(
      Math.round(
        (this.savings / this.totalIncome) * 100
      ),
      0
    );

  }


  // =====================================================
  // DISPLAY TOTALS
  // =====================================================

  get displayTotalIncome(): number {
    return this.convertAmount(this.totalIncome);
  }

  get displayTotalExpenses(): number {
    return this.convertAmount(this.totalExpenses);
  }

  get displayBalance(): number {
    return this.convertAmount(this.balance);
  }

  get displaySavings(): number {
    return this.convertAmount(this.savings);
  }


  // =====================================================
  // BUDGET
  // =====================================================

  get budgetSpent(): number {
    return this.totalExpenses;
  }


  get budgetRemaining(): number {

    return Math.max(
      this.monthlyBudget - this.budgetSpent,
      0
    );

  }


  get budgetPercentage(): number {

    if (this.monthlyBudget <= 0) {
      return 0;
    }

    return Math.min(
      (this.budgetSpent / this.monthlyBudget) * 100,
      100
    );

  }


  get displayMonthlyBudget(): number {
    return this.convertAmount(this.monthlyBudget);
  }

  get displayBudgetSpent(): number {
    return this.convertAmount(this.budgetSpent);
  }

  get displayBudgetRemaining(): number {
    return this.convertAmount(this.budgetRemaining);
  }

  get budgetUsagePercentage(): number {
    return this.budgetPercentage;
  }


  // =====================================================
  // BUDGET ALERT
  // =====================================================

  get showBudgetAlert(): boolean {

    if (!this.budgetAlerts) {
      return false;
    }

    if (this.monthlyBudget <= 0) {
      return false;
    }

    return (
      this.budgetSpent >=
      this.monthlyBudget * 0.8
    );

  }


  get budgetAlertTitle(): string {

    if (this.budgetPercentage >= 100) {
      return 'Monthly budget exceeded';
    }

    return 'You are approaching your budget';

  }


  get budgetAlertMessage(): string {

    if (this.budgetPercentage >= 100) {

      const exceededBy =
        this.budgetSpent -
        this.monthlyBudget;

      return `You have exceeded your monthly budget by ${this.currencySymbol}${this.formatAmount(
        this.convertAmount(exceededBy)
      )}.`;

    }

    return `You have ${this.currencySymbol}${this.formatAmount(
      this.displayBudgetRemaining
    )} remaining in your monthly budget.`;

  }


  get budgetAlertLevel():
    'warning' | 'danger' {

    if (this.budgetPercentage >= 100) {
      return 'danger';
    }

    return 'warning';

  }


  // =====================================================
  // NOTIFICATIONS
  // =====================================================

  get notificationsEnabled(): boolean {
    return this.notificationsEnabledSetting;
  }


  get notificationCount(): number {

    if (!this.notificationsEnabled) {
      return 0;
    }

    let count = 0;

    if (this.showBudgetAlert) {
      count++;
    }

    return count;

  }


  toggleNotifications(): void {

    if (!this.notificationsEnabled) {
      return;
    }

    this.notificationOpen =
      !this.notificationOpen;

    this.cdr.detectChanges();

  }


  closeNotifications(): void {

    this.notificationOpen = false;

    this.cdr.detectChanges();

  }


  // =====================================================
  // DASHBOARD INTELLIGENCE
  // =====================================================

  get hasFinancialData(): boolean {

    return (
      this.totalIncome > 0 ||
      this.totalExpenses > 0 ||
      this.monthlyBudget > 0
    );

  }


  // -----------------------------------------------------
  // TOP SPENDING CATEGORY
  // -----------------------------------------------------

  get topSpendingCategory(): string {

    const categories = [
      'Food',
      'Transport',
      'Shopping',
      'Entertainment',
      'Bills',
      'Health',
      'Other'
    ];

    let topCategory = 'Other';
    let highestAmount = 0;

    for (const category of categories) {

      const amount =
        this.getCategoryAmount(category);

      if (amount > highestAmount) {

        highestAmount = amount;
        topCategory = category;

      }

    }

    return highestAmount > 0
      ? topCategory
      : 'No spending yet';

  }


  get topSpendingAmount(): number {

    if (this.topSpendingCategory === 'No spending yet') {
      return 0;
    }

    return this.getCategoryAmount(
      this.topSpendingCategory
    );

  }


  get topSpendingDisplayAmount(): number {

    return this.convertAmount(
      this.topSpendingAmount
    );

  }


  // -----------------------------------------------------
  // TOP CATEGORY ICON
  // -----------------------------------------------------

  get topSpendingIcon(): string {

    const icons: { [key: string]: string } = {

      Food: '🍔',
      Transport: '🚕',
      Shopping: '🛍️',
      Entertainment: '🎬',
      Bills: '📄',
      Health: '💊',
      Other: '💰'

    };

    return icons[this.topSpendingCategory] || '💰';

  }


  // -----------------------------------------------------
  // SPENDING SHARE
  // -----------------------------------------------------

  get topSpendingPercentage(): number {

    if (this.totalExpenses <= 0) {
      return 0;
    }

    return Math.round(
      (
        this.topSpendingAmount /
        this.totalExpenses
      ) * 100
    );

  }


  // -----------------------------------------------------
  // FINANCIAL HEALTH
  // -----------------------------------------------------

  get financialHealth(): 'Excellent' | 'Good' | 'Needs attention' {

    if (this.totalIncome <= 0) {
      return 'Needs attention';
    }

    if (this.savingsPercentage >= 30) {
      return 'Excellent';
    }

    if (this.savingsPercentage >= 15) {
      return 'Good';
    }

    return 'Needs attention';

  }


  // -----------------------------------------------------
  // HEALTH MESSAGE
  // -----------------------------------------------------

  get financialHealthMessage(): string {

    if (this.totalIncome <= 0) {

      return 'Add an income transaction to start understanding your financial health.';

    }

    if (this.savingsPercentage >= 30) {

      return 'Great job! You are keeping a healthy portion of your income.';

    }

    if (this.savingsPercentage >= 15) {

      return 'You are building savings, but there is still room to improve.';

    }

    if (this.totalExpenses >= this.totalIncome) {

      return 'Your expenses are using most or all of your income. Consider reducing non-essential spending.';

    }

    return 'Try to keep more of your income available for savings and future goals.';

  }


  // -----------------------------------------------------
  // BUDGET INSIGHT
  // -----------------------------------------------------

  get intelligenceBudgetMessage(): string {

    if (this.monthlyBudget <= 0) {

      return 'Set a monthly budget to get personalized spending guidance.';

    }

    if (this.budgetPercentage >= 100) {

      return 'You have crossed your monthly budget. Consider reviewing your largest expenses.';

    }

    if (this.budgetPercentage >= 80) {

      return 'You are close to your monthly budget. Keep an eye on discretionary spending.';

    }

    if (this.budgetPercentage >= 50) {

      return 'You are halfway through your budget. Your current spending is still within the planned limit.';

    }

    return 'Your spending is comfortably below your monthly budget.';

  }


  // -----------------------------------------------------
  // MAIN SMART INSIGHT
  // -----------------------------------------------------

  get smartInsightTitle(): string {

    if (!this.hasFinancialData) {
      return 'Start building your financial picture';
    }

    if (this.totalIncome <= 0 && this.totalExpenses > 0) {
      return 'Your spending needs attention';
    }

    if (this.budgetPercentage >= 100) {
      return 'Your budget needs attention';
    }

    if (this.topSpendingCategory !== 'No spending yet') {

      return `${this.topSpendingCategory} is your biggest spending area`;

    }

    if (this.savingsPercentage >= 30) {
      return 'You are building strong savings';
    }

    return 'Keep an eye on your spending';

  }


  // -----------------------------------------------------
  // MAIN SMART INSIGHT MESSAGE
  // -----------------------------------------------------

  get smartInsightMessage(): string {

    if (!this.hasFinancialData) {

      return 'Add your income, expenses and budget to unlock personalized insights.';

    }

    if (this.totalIncome <= 0 && this.totalExpenses > 0) {

      return `You've recorded ${this.currencySymbol}${this.formatAmount(
        this.displayTotalExpenses
      )} in expenses but no income yet. Add your income to get a clearer financial picture.`;

    }

    if (this.budgetPercentage >= 100) {

      return `You've used ${this.budgetPercentage}% of your monthly budget. Consider reviewing your ${this.topSpendingCategory.toLowerCase()} spending.`;

    }

    if (this.topSpendingCategory !== 'No spending yet') {

      return `${this.topSpendingIcon} ${this.topSpendingCategory} accounts for ${this.topSpendingPercentage}% of your total expenses.`;

    }

    return 'Keep recording your transactions to receive more personalized insights.';

  }


  // -----------------------------------------------------
  // PERSONALIZED TIP
  // -----------------------------------------------------

  get personalizedTip(): string {

    if (this.totalIncome <= 0) {

      return 'Tip: Add your regular income first so CashFlex can calculate your savings rate.';

    }

    if (this.budgetPercentage >= 100) {

      return `Tip: Review your ${this.topSpendingCategory.toLowerCase()} expenses and look for areas you can reduce.`;

    }

    if (this.budgetPercentage >= 80) {

      return 'Tip: You are close to your budget limit. Try to avoid unnecessary purchases for the rest of the month.';

    }

    if (this.savingsPercentage >= 30) {

      return 'Tip: Your savings rate looks strong. Consider directing some savings toward one of your goals.';

    }

    if (this.savingsPercentage >= 15) {

      return 'Tip: Try increasing your savings slightly each month before increasing discretionary spending.';

    }

    return 'Tip: Start by tracking every expense and setting a realistic monthly budget.';

  }


  // =====================================================
  // CATEGORY AMOUNT
  // =====================================================

  getCategoryAmount(
    category: string
  ): number {

    return this.transactions()

      .filter(transaction =>

        transaction.type === 'expense' &&

        transaction.category
          .toLowerCase() ===
        category.toLowerCase()

      )

      .reduce(

        (total, transaction) =>

          total +
          Number(
            transaction.amount || 0
          ),

        0

      );

  }


  // =====================================================
  // CATEGORY DISPLAY AMOUNT
  // =====================================================

  getCategoryDisplayAmount(
    category: string
  ): number {

    return this.convertAmount(
      this.getCategoryAmount(category)
    );

  }


  // =====================================================
  // CATEGORY PERCENTAGE
  // =====================================================

  getCategoryPercentage(
    category: string
  ): number {

    if (this.totalExpenses <= 0) {
      return 0;
    }

    const categoryAmount =
      this.getCategoryAmount(category);

    return Math.round(
      (
        categoryAmount /
        this.totalExpenses
      ) * 100
    );

  }


  // =====================================================
  // CATEGORY BAR WIDTH
  // =====================================================

  getCategoryBarWidth(
    category: string
  ): number {

    return this.getCategoryPercentage(category);

  }


  // =====================================================
  // CATEGORY COUNT
  // =====================================================

  getCategoryCount(
    category: string
  ): number {

    return this.transactions()

      .filter(transaction =>

        transaction.type === 'expense' &&

        transaction.category
          .toLowerCase() ===
        category.toLowerCase()

      )

      .length;

  }


  // =====================================================
  // RECENT TRANSACTIONS
  // =====================================================

  get recentTransactions(): Transaction[] {

    return this.transactions()
      .slice(0, 5);

  }


  // =====================================================
  // OPEN ADD TRANSACTION
  // =====================================================

  openAddTransaction(
    type:
      'income' | 'expense' =
      'expense'
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


  // =====================================================
  // CLOSE ADD TRANSACTION
  // =====================================================

  closeAddTransaction(): void {

    this.showAddTransaction = false;

    this.cdr.detectChanges();

  }


  // =====================================================
  // ADD TRANSACTION
  // =====================================================

  async addTransaction(): Promise<void> {

    if (!this.newTransaction.title.trim()) {
      return;
    }

    if (this.newTransaction.amount <= 0) {
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

      const rate =
        this.currencyRate || 1;

      const amountInINR =
        Number(
          this.newTransaction.amount
        ) / rate;

      await this.transactionService
        .addTransaction({

          title:
            this.newTransaction.title.trim(),

          category:
            this.newTransaction.category,

          amount:
            amountInINR,

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
        'DASHBOARD: Add transaction error:',
        error
      );

      this.errorMessage =
        'Unable to add this transaction. Please try again.';

      this.cdr.detectChanges();

    }

  }


  // =====================================================
  // DELETE TRANSACTION
  // =====================================================

  async deleteTransaction(
    id: string
  ): Promise<void> {

    try {

      await this.transactionService
        .deleteTransaction(id);

      this.cdr.detectChanges();

    } catch (error) {

      console.error(
        'DASHBOARD: Delete transaction error:',
        error
      );

      this.errorMessage =
        'Unable to delete this transaction. Please try again.';

    }

  }


  // =====================================================
  // FORMAT AMOUNT
  // =====================================================

  formatAmount(
    amount: number
  ): string {

    return Number(amount)
      .toLocaleString(
        'en-IN',
        {
          maximumFractionDigits: 2
        }
      );

  }

}