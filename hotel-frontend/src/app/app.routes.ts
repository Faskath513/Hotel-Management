import { Routes, Router } from '@angular/router';
import { inject } from '@angular/core';
import { RoomsComponent } from './components/rooms/rooms.component';
import { GuestsComponent } from './components/guests/guests.component';
import { BookingsComponent } from './components/bookings/bookings.component';
import { ReportsComponent } from './components/reports/reports.component';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';

const authGuard = () => {
  const token = (() => {
    try { return localStorage.getItem('auth_token'); } catch { return null; }
  })();
  if (token) return true;
  const router = inject(Router);
  return router.parseUrl('/login');
};

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canMatch: [authGuard] },
  { path: 'rooms', component: RoomsComponent, canMatch: [authGuard] },
  { path: 'guests', component: GuestsComponent, canMatch: [authGuard] },
  { path: 'bookings', component: BookingsComponent, canMatch: [authGuard] },
  { path: 'reports', component: ReportsComponent, canMatch: [authGuard] },
  { path: '**', redirectTo: 'rooms' }
];
