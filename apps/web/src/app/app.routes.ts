import { Routes } from '@angular/router';
import { AuthCallback } from './auth/auth-callback';
import { AuthPage } from './auth/auth-page';
import { WorkspacePage } from './workspace/workspace-page';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: AuthPage, data: { mode: 'login' } },
  { path: 'register', component: AuthPage, data: { mode: 'register' } },
  { path: 'auth/callback', component: AuthCallback },
  { path: 'workspace', component: WorkspacePage },
  { path: '**', redirectTo: 'login' },
];
