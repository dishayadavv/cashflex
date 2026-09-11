import {
  Component,
  OnInit,
  ChangeDetectorRef,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  TransactionService,
  Transaction
} from '../../services/transaction';

import { CurrencyService } from '../../services/currency';


interface CategoryData {
  name: string;
  icon: string;
  amount: number;
  percentage: number;
}


interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
}


type AnalysisPeriod =
  'weekly' |
  'monthly' |
  'sixMonths';


@Component({
  selector: 'app-analytics',

  imports: [
    CommonModule
  ],

  templateUrl: './analytics.html',

  styleUrl: './analytics.css'
})
export class Analytics implements OnInit {

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


  // ==========================================
  // ANALYSIS PERIOD
  // ==========================================

  selectedPeriod: AnalysisPeriod =
    'sixMonths';


  // ==========================================
  // INITIALIZE
  // ==========================================

  ngOnInit(): void {

    this.loadAnalytics();

  }


  // ==========================================
  // LOAD ANALYTICS
  // ==========================================

  async loadAnalytics(): Promise<void> {

    this.loading = true;

    this.errorMessage = '';

    try {

      console.log(
        'ANALYTICS: Loading transactions...'
      );

      await Promise.all([

        this.transactionService.loadTransactions(),

        this.currencyService.loadCurrency()

      ]);

      console.log(
        'ANALYTICS: Transactions loaded:',
        this.transactions()
      );

      console.log(
        'ANALYTICS: Chart data:',
        this.monthlyData
      );

    } catch (error) {

      console.error(
        'ANALYTICS: Loading error:',
        error
      );

      this.errorMessage =
        'Unable to load your analytics. Please try again.';

    } finally {

      this.loading = false;

      this.cdr.detectChanges();

    }

  }


  // ==========================================
  // CHANGE ANALYSIS PERIOD
  // ==========================================

  setAnalysisPeriod(
    period: AnalysisPeriod
  ): void {

    this.selectedPeriod = period;

    this.cdr.detectChanges();

    console.log(
      'ANALYTICS: Selected period:',
      period
    );

    console.log(
      'ANALYTICS: Chart data:',
      this.monthlyData
    );

  }


  // ==========================================
  // PERIOD TITLE
  // ==========================================

  get chartPeriodLabel(): string {

    switch (
      this.selectedPeriod
    ) {

      case 'weekly':

        return 'LAST 7 DAYS';

      case 'monthly':

        return 'THIS MONTH';

      default:

        return 'SIX MONTH VIEW';

    }

  }


  // ==========================================
  // CHART TITLE
  // ==========================================

  get chartTitle(): string {

    switch (
      this.selectedPeriod
    ) {

      case 'weekly':

        return 'Income vs expenses';

      case 'monthly':

        return 'Daily income vs expenses';

      default:

        return 'Income vs expenses';

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
  // INCOME
  // ==========================================

  get income(): number {

    return this.transactionService
      .getTotalIncome();

  }


  get displayIncome(): number {

    return this.convertAmount(
      this.income
    );

  }


  // ==========================================
  // EXPENSES
  // ==========================================

  get expenses(): number {

    return this.transactionService
      .getTotalExpenses();

  }


  get displayExpenses(): number {

    return this.convertAmount(
      this.expenses
    );

  }


  // ==========================================
  // SAVINGS
  // ==========================================

  get savings(): number {

    return this.income -
      this.expenses;

  }


  get displaySavings(): number {

    return this.convertAmount(
      this.savings
    );

  }


  // ==========================================
  // SAVINGS RATE
  // ==========================================

  get savingsRate(): number {

    if (this.income === 0) {

      return 0;

    }

    return Math.round(
      (
        this.savings /
        this.income
      ) * 100
    );

  }


  // ==========================================
  // CATEGORIES
  // ==========================================

  get categories(): CategoryData[] {

    const expenseTransactions =
      this.transactions().filter(
        transaction =>
          transaction.type === 'expense'
      );


    const categoryMap:
      {
        [key: string]: {
          amount: number;
          icon: string;
        }
      } = {};


    expenseTransactions.forEach(
      transaction => {

        if (
          !categoryMap[
            transaction.category
          ]
        ) {

          categoryMap[
            transaction.category
          ] = {

            amount: 0,

            icon:
              transaction.icon

          };

        }


        categoryMap[
          transaction.category
        ].amount +=
          transaction.amount;

      }
    );


    const totalExpenses =
      this.expenses;


    return Object.entries(
      categoryMap
    )

      .map(
        ([name, data]) => ({

          name,

          icon:
            data.icon,

          amount:
            data.amount,

          percentage:
            totalExpenses === 0

              ? 0

              : Math.round(
                  (
                    data.amount /
                    totalExpenses
                  ) * 100
                )

        })
      )

      .sort(
        (a, b) =>
          b.amount - a.amount
      );

  }


  // ==========================================
  // CATEGORY DISPLAY AMOUNT
  // ==========================================

  getCategoryDisplayAmount(
    category: CategoryData
  ): number {

    return this.convertAmount(
      category.amount
    );

  }


  // ==========================================
  // HIGHEST CATEGORY
  // ==========================================

  get highestCategory(): CategoryData {

    const data =
      this.categories;


    if (data.length === 0) {

      return {

        name: 'No expenses',

        icon: '◦',

        amount: 0,

        percentage: 0

      };

    }


    return data[0];

  }


  // ==========================================
  // HIGHEST CATEGORY DISPLAY
  // ==========================================

  get highestCategoryDisplayAmount(): number {

    return this.convertAmount(
      this.highestCategory.amount
    );

  }


  // ==========================================
  // AVERAGE MONTHLY EXPENSE
  // ==========================================

  get averageMonthlyExpense(): number {

    const expenseTransactions =
      this.transactions().filter(
        transaction =>
          transaction.type === 'expense'
      );


    if (
      expenseTransactions.length === 0
    ) {

      return 0;

    }


    const months =
      new Set<string>();


    expenseTransactions.forEach(
      transaction => {

        const date =
          this.parseTransactionDate(
            transaction
          );


        if (date) {

          const key =
            `${date.getFullYear()}-${String(
              date.getMonth() + 1
            ).padStart(2, '0')}`;

          months.add(key);

        }

      }
    );


    if (months.size === 0) {

      return 0;

    }


    return Math.round(
      this.expenses /
      months.size
    );

  }


  // ==========================================
  // DISPLAY AVERAGE EXPENSE
  // ==========================================

  get displayAverageMonthlyExpense(): number {

    return this.convertAmount(
      this.averageMonthlyExpense
    );

  }


  // ==========================================
  // PARSE TRANSACTION DATE
  // ==========================================

  private parseTransactionDate(
    transaction: Transaction
  ): Date | null {

    const rawDate =
      String(
        transaction.date ?? ''
      ).trim();


    if (!rawDate) {

      return null;

    }


    // Real ISO / normal date
    const normalDate =
      new Date(rawDate);


    if (
      !isNaN(
        normalDate.getTime()
      )
    ) {

      return normalDate;

    }


    // Existing transactions
    // that were stored as "Just now"
    if (
      rawDate.toLowerCase() ===
      'just now'
    ) {

      return new Date();

    }


    // Today
    if (
      rawDate.toLowerCase() ===
      'today'
    ) {

      return new Date();

    }


    // Yesterday
    if (
      rawDate.toLowerCase() ===
      'yesterday'
    ) {

      const date =
        new Date();

      date.setDate(
        date.getDate() - 1
      );

      return date;

    }


    return null;

  }


  // ==========================================
  // MONTHLY DATA
  // ==========================================

  get monthlyData(): MonthlyData[] {

    switch (
      this.selectedPeriod
    ) {

      case 'weekly':

        return this.getWeeklyData();

      case 'monthly':

        return this.getCurrentMonthData();

      default:

        return this.getSixMonthData();

    }

  }


  // ==========================================
  // WEEKLY DATA
  // ==========================================

  private getWeeklyData(): MonthlyData[] {

    const now =
      new Date();


    const data:
      MonthlyData[] = [];


    // Last 7 days
    for (
      let i = 6;
      i >= 0;
      i--
    ) {

      const date =
        new Date(now);


      date.setHours(
        0,
        0,
        0,
        0
      );


      date.setDate(
        now.getDate() - i
      );


      data.push({

        month:
          date.toLocaleString(
            'en-IN',
            {
              weekday: 'short'
            }
          ),

        income: 0,

        expenses: 0

      });

    }


    this.transactions().forEach(
      transaction => {

        const date =
          this.parseTransactionDate(
            transaction
          );


        if (!date) {

          return;

        }


        const transactionDate =
          new Date(date);


        transactionDate.setHours(
          0,
          0,
          0,
          0
        );


        const today =
          new Date(now);

        today.setHours(
          0,
          0,
          0,
          0
        );


        const difference =
          Math.floor(
            (
              today.getTime() -
              transactionDate.getTime()
            ) /
            (
              1000 *
              60 *
              60 *
              24
            )
          );


        if (
          difference < 0 ||
          difference > 6
        ) {

          return;

        }


        const index =
          6 - difference;


        if (
          transaction.type ===
          'income'
        ) {

          data[index].income +=
            Number(
              transaction.amount
            ) || 0;

        } else {

          data[index].expenses +=
            Number(
              transaction.amount
            ) || 0;

        }

      }
    );


    return data;

  }


  // ==========================================
  // CURRENT MONTH DATA
  // ==========================================

  private getCurrentMonthData(): MonthlyData[] {

    const now =
      new Date();


    const year =
      now.getFullYear();

    const month =
      now.getMonth();


    const numberOfDays =
      now.getDate();


    const data:
      MonthlyData[] = [];


    for (
      let day = 1;
      day <= numberOfDays;
      day++
    ) {

      data.push({

        month:
          String(day),

        income: 0,

        expenses: 0

      });

    }


    this.transactions().forEach(
      transaction => {

        const date =
          this.parseTransactionDate(
            transaction
          );


        if (!date) {

          return;

        }


        if (
          date.getFullYear() !== year ||
          date.getMonth() !== month
        ) {

          return;

        }


        const index =
          date.getDate() - 1;


        if (
          index < 0 ||
          index >= data.length
        ) {

          return;

        }


        if (
          transaction.type ===
          'income'
        ) {

          data[index].income +=
            Number(
              transaction.amount
            ) || 0;

        } else {

          data[index].expenses +=
            Number(
              transaction.amount
            ) || 0;

        }

      }
    );


    return data;

  }


  // ==========================================
  // SIX MONTH DATA
  // ==========================================

  private getSixMonthData(): MonthlyData[] {

    const now =
      new Date();


    const data:
      MonthlyData[] = [];


    for (
      let i = 5;
      i >= 0;
      i--
    ) {

      const date =
        new Date(
          now.getFullYear(),
          now.getMonth() - i,
          1
        );


      data.push({

        month:
          date.toLocaleString(
            'en-IN',
            {
              month: 'short'
            }
          ),

        income: 0,

        expenses: 0

      });

    }


    this.transactions().forEach(
      transaction => {

        const date =
          this.parseTransactionDate(
            transaction
          );


        if (!date) {

          return;

        }


        const monthDifference =
          (
            now.getFullYear() -
            date.getFullYear()
          ) * 12
          +
          (
            now.getMonth() -
            date.getMonth()
          );


        if (
          monthDifference < 0 ||
          monthDifference > 5
        ) {

          return;

        }


        const index =
          5 -
          monthDifference;


        if (
          transaction.type ===
          'income'
        ) {

          data[index].income +=
            Number(
              transaction.amount
            ) || 0;

        } else {

          data[index].expenses +=
            Number(
              transaction.amount
            ) || 0;

        }

      }
    );


    return data;

  }


  // ==========================================
  // CHART HEIGHT
  // ==========================================

  getChartHeight(
    value: number
  ): number {

    const data =
      this.monthlyData;


    if (
      data.length === 0
    ) {

      return 0;

    }


    const maxValue =
      Math.max(

        ...data.map(
          item =>
            Math.max(
              item.income,
              item.expenses
            )
        ),

        0

      );


    if (
      maxValue <= 0 ||
      value <= 0
    ) {

      return 0;

    }


    const percentage =
      (
        value /
        maxValue
      ) * 100;


    // Keep tiny values visible
    if (
      percentage > 0 &&
      percentage < 4
    ) {

      return 4;

    }


    return Math.min(
      Math.round(
        percentage
      ),
      100
    );

  }

}