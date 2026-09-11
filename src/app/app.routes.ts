import { Routes } from '@angular/router';

import { Dashboard } from './pages/dashboard/dashboard';
import { Transactions } from './pages/transactions/transactions';
import { Budget } from './pages/budget/budget';
import { Goals } from './pages/goals/goals';
import { Analytics } from './pages/analytics/analytics';
import { Settings } from './pages/settings/settings';

import { Login } from './pages/login/login';
import { Signup } from './pages/signup/signup';

import { authGuard } from './guards/auth-guard';

export const routes: Routes = [

  // Public pages
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  {
    path: 'login',
    component: Login
  },

  {
    path: 'signup',
    component: Signup
  },


  // Protected CashFlex pages
  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [authGuard]
  },

  {
    path: 'transactions',
    component: Transactions,
    canActivate: [authGuard]
  },

  {
    path: 'budget',
    component: Budget,
    canActivate: [authGuard]
  },

  {
    path: 'goals',
    component: Goals,
    canActivate: [authGuard]
  },

  {
    path: 'analytics',
    component: Analytics,
    canActivate: [authGuard]
  },

  {
    path: 'settings',
    component: Settings,
    canActivate: [authGuard]
  },


  // Unknown URL
  {
    path: '**',
    redirectTo: 'login'
  }

];