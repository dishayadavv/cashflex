import {
  Component,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  updateDoc
} from 'firebase/firestore';

import {
  getAuth,
  onAuthStateChanged
} from 'firebase/auth';

import { firebaseApp } from '../../firebase.config';

import { CurrencyService } from '../../services/currency';


interface Goal {

  id: string;

  name: string;

  icon: string;

  target: number;

  saved: number;

  date: string;

}


@Component({
  selector: 'app-goals',

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl: './goals.html',

  styleUrl: './goals.css'
})
export class Goals {

  private firestore =
    getFirestore(firebaseApp);

  private auth =
    getAuth(firebaseApp);

  private currencyService: CurrencyService;

  private cdr: ChangeDetectorRef;


  goals: Goal[] = [];


  showAddGoal = false;

  showAddMoney = false;


  selectedGoal: Goal | null = null;


  newGoal = {

    name: '',

    target: 0,

    date: ''

  };


  moneyAmount = 0;


  private unsubscribeGoals:
    (() => void) | null = null;


  constructor(
    cdr: ChangeDetectorRef,
    currencyService: CurrencyService
  ) {

    this.cdr = cdr;

    this.currencyService = currencyService;


    onAuthStateChanged(
      this.auth,
      async (user) => {

        this.stopListening();

        this.goals = [];


        if (user) {

          console.log(
            'GOALS: User logged in:',
            user.uid
          );


          // Load the currently selected currency
          await this.currencyService.loadCurrency();


          this.listenToGoals(
            user.uid
          );

        }


        this.cdr.detectChanges();

      }
    );

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
  // LISTEN TO USER GOALS
  // ==========================================

  private listenToGoals(
    userId: string
  ): void {

    const goalsRef =
      collection(
        this.firestore,
        'users',
        userId,
        'goals'
      );


    const goalsQuery =
      query(
        goalsRef,
        orderBy('createdAt', 'desc')
      );


    this.unsubscribeGoals =
      onSnapshot(

        goalsQuery,

        (snapshot) => {

          console.log(
            'GOALS: Firebase returned:',
            snapshot.size,
            'goal(s)'
          );


          this.goals =
            snapshot.docs.map(
              (document) => {

                const data =
                  document.data();


                console.log(
                  'GOALS: Loaded goal:',
                  document.id,
                  data
                );


                return {

                  id:
                    document.id,

                  name:
                    String(
                      data['name'] ||
                      'Untitled Goal'
                    ),

                  icon:
                    String(
                      data['icon'] ||
                      '◇'
                    ),

                  // Stored in INR
                  target:
                    Number(
                      data['target']
                    ) || 0,

                  // Stored in INR
                  saved:
                    Number(
                      data['saved']
                    ) || 0,

                  date:
                    String(
                      data['date'] ||
                      'Not set'
                    )

                };

              }
            );


          console.log(
            'GOALS: Goals displayed:',
            this.goals
          );


          this.cdr.detectChanges();

        },

        (error) => {

          console.error(
            'Firestore goal error:',
            error
          );


          this.cdr.detectChanges();

        }

      );

  }


  // ==========================================
  // TOTAL TARGET
  // ==========================================

  get totalTarget(): number {

    return this.goals.reduce(
      (total, goal) =>
        total + goal.target,
      0
    );

  }


  // ==========================================
  // DISPLAY TOTAL TARGET
  // ==========================================

  get displayTotalTarget(): number {

    return this.convertAmount(
      this.totalTarget
    );

  }


  // ==========================================
  // TOTAL SAVED
  // ==========================================

  get totalSaved(): number {

    return this.goals.reduce(
      (total, goal) =>
        total + goal.saved,
      0
    );

  }


  // ==========================================
  // DISPLAY TOTAL SAVED
  // ==========================================

  get displayTotalSaved(): number {

    return this.convertAmount(
      this.totalSaved
    );

  }


  // ==========================================
  // TOTAL REMAINING
  // ==========================================

  get totalRemaining(): number {

    return Math.max(
      this.totalTarget -
      this.totalSaved,
      0
    );

  }


  // ==========================================
  // DISPLAY TOTAL REMAINING
  // ==========================================

  get displayTotalRemaining(): number {

    return this.convertAmount(
      this.totalRemaining
    );

  }


  // ==========================================
  // OVERALL PERCENTAGE
  // ==========================================

  get overallPercentage(): number {

    if (this.totalTarget === 0) {

      return 0;

    }


    return Math.round(
      (
        this.totalSaved /
        this.totalTarget
      ) * 100
    );

  }


  // ==========================================
  // OPEN ADD GOAL
  // ==========================================

  openAddGoal(): void {

    this.newGoal = {

      name: '',

      target: 0,

      date: ''

    };


    this.showAddGoal = true;


    this.cdr.detectChanges();

  }


  // ==========================================
  // CLOSE ADD GOAL
  // ==========================================

  closeAddGoal(): void {

    this.showAddGoal = false;

    this.cdr.detectChanges();

  }


  // ==========================================
  // ADD GOAL
  // ==========================================

  async addGoal(): Promise<void> {

    if (
      !this.newGoal.name.trim() ||
      this.newGoal.target <= 0
    ) {

      return;

    }


    const user =
      this.auth.currentUser;


    if (!user) {

      console.error(
        'User is not logged in.'
      );

      return;

    }


    try {

      const goalsRef =
        collection(
          this.firestore,
          'users',
          user.uid,
          'goals'
        );


      /*
       * IMPORTANT:
       * User enters the amount in the
       * selected currency.
       *
       * Firebase stores the amount in INR.
       */

      const targetInINR =
        Number(
          this.newGoal.target
        ) /
        this.currencyRate;


      await addDoc(
        goalsRef,
        {

          name:
            this.newGoal.name.trim(),

          icon:
            '◇',

          target:
            Number(targetInINR),

          saved:
            0,

          date:
            this.newGoal.date ||
            'Not set',

          createdAt:
            Date.now()

        }
      );


      this.closeAddGoal();


    } catch (error) {

      console.error(
        'Unable to add goal:',
        error
      );

    }

  }


  // ==========================================
  // DELETE GOAL
  // ==========================================

  async deleteGoal(
    id: string
  ): Promise<void> {

    const user =
      this.auth.currentUser;


    if (!user) {

      return;

    }


    try {

      const goalRef =
        doc(
          this.firestore,
          'users',
          user.uid,
          'goals',
          id
        );


      await deleteDoc(
        goalRef
      );


    } catch (error) {

      console.error(
        'Unable to delete goal:',
        error
      );

    }

  }


  // ==========================================
  // GOAL PERCENTAGE
  // ==========================================

  getPercentage(
    goal: Goal
  ): number {

    if (goal.target === 0) {

      return 0;

    }


    return Math.round(
      (
        goal.saved /
        goal.target
      ) * 100
    );

  }


  // ==========================================
  // PROGRESS WIDTH
  // ==========================================

  getProgressWidth(
    goal: Goal
  ): number {

    return Math.min(
      this.getPercentage(goal),
      100
    );

  }


  // ==========================================
  // REMAINING
  // ==========================================

  getRemaining(
    goal: Goal
  ): number {

    return Math.max(
      goal.target -
      goal.saved,
      0
    );

  }


  // ==========================================
  // DISPLAY GOAL TARGET
  // ==========================================

  getDisplayTarget(
    goal: Goal
  ): number {

    return this.convertAmount(
      goal.target
    );

  }


  // ==========================================
  // DISPLAY GOAL SAVED
  // ==========================================

  getDisplaySaved(
    goal: Goal
  ): number {

    return this.convertAmount(
      goal.saved
    );

  }


  // ==========================================
  // DISPLAY GOAL REMAINING
  // ==========================================

  getDisplayRemaining(
    goal: Goal
  ): number {

    return this.convertAmount(
      this.getRemaining(goal)
    );

  }


  // ==========================================
  // OPEN ADD MONEY
  // ==========================================

  openAddMoney(
    goal: Goal
  ): void {

    this.selectedGoal = goal;

    this.moneyAmount = 0;

    this.showAddMoney = true;

    this.cdr.detectChanges();

  }


  // ==========================================
  // CLOSE ADD MONEY
  // ==========================================

  closeAddMoney(): void {

    this.showAddMoney = false;

    this.selectedGoal = null;

    this.cdr.detectChanges();

  }


  // ==========================================
  // ADD MONEY TO GOAL
  // ==========================================

  async addMoney(): Promise<void> {

    if (
      !this.selectedGoal ||
      this.moneyAmount <= 0
    ) {

      return;

    }


    const user =
      this.auth.currentUser;


    if (!user) {

      return;

    }


    try {

      /*
       * User enters money in the selected
       * currency.
       *
       * Convert it back to INR before
       * saving to Firebase.
       */

      const moneyInINR =
        Number(
          this.moneyAmount
        ) /
        this.currencyRate;


      const newSavedAmount =
        Math.min(

          this.selectedGoal.saved +
          moneyInINR,

          this.selectedGoal.target

        );


      const goalRef =
        doc(
          this.firestore,
          'users',
          user.uid,
          'goals',
          this.selectedGoal.id
        );


      await updateDoc(
        goalRef,
        {

          saved:
            newSavedAmount

        }
      );


      this.closeAddMoney();


    } catch (error) {

      console.error(
        'Unable to update goal:',
        error
      );

    }

  }


  // ==========================================
  // STOP FIRESTORE LISTENER
  // ==========================================

  private stopListening(): void {

    if (this.unsubscribeGoals) {

      this.unsubscribeGoals();

      this.unsubscribeGoals = null;

    }

  }

}