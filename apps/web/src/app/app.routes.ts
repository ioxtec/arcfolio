import { Routes } from '@angular/router';
import { AuthCallback } from './auth/auth-callback';
import { AuthPage } from './auth/auth-page';
import { ResumeHistoryPage } from './resumes/resume-history-page';
import { ResumesPage } from './resumes/resumes-page';
import { WorkspaceShell } from './workspace/workspace-shell';
import { WorkspacePlaceholderPage } from './workspace/workspace-placeholder-page';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: AuthPage, data: { mode: 'login' } },
  { path: 'register', component: AuthPage, data: { mode: 'register' } },
  { path: 'auth/callback', component: AuthCallback },
  {
    path: 'workspace',
    component: WorkspaceShell,
    children: [
      { path: '', pathMatch: 'full', component: ResumesPage },
      { path: 'resumes/:id', component: ResumeHistoryPage },
      { path: 'dashboard', component: WorkspacePlaceholderPage, data: { title: 'Pulpit' } },
      { path: 'templates', component: WorkspacePlaceholderPage, data: { title: 'Szablony' } },
      { path: 'profile', component: WorkspacePlaceholderPage, data: { title: 'Profil' } },
      { path: 'settings', component: WorkspacePlaceholderPage, data: { title: 'Ustawienia' } },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
