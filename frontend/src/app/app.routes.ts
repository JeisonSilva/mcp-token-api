import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./features/layout/layout.component').then((m) => m.LayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/apikeys/apikeys.component').then((m) => m.ApiKeysComponent),
      },
      {
        path: 'admin/users',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/admin/users/users.component').then((m) => m.UsersComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
