import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterLink, RouterLinkActive,
    MatToolbarModule, MatSidenavModule, MatListModule,
    MatIconModule, MatButtonModule, MatMenuModule, MatDividerModule,
  ],
  template: `
    <mat-sidenav-container class="sidenav-container">
      <mat-sidenav #sidenav mode="side" opened class="sidenav">
        <div class="sidenav-header">
          <mat-icon class="brand-icon">vpn_key</mat-icon>
          <span class="brand-name">MCP Token API</span>
        </div>

        <mat-nav-list class="nav-list">
          <a mat-list-item routerLink="/dashboard" routerLinkActive="active-link">
            <mat-icon matListItemIcon>key</mat-icon>
            <span matListItemTitle>API Keys</span>
          </a>
          <a mat-list-item *ngIf="auth.isAdmin()" routerLink="/admin/users" routerLinkActive="active-link">
            <mat-icon matListItemIcon>group</mat-icon>
            <span matListItemTitle>Usuários</span>
          </a>
        </mat-nav-list>

        <div class="sidenav-footer">
          <mat-divider></mat-divider>
          <div class="user-info">
            <div class="user-avatar">{{ initials() }}</div>
            <div class="user-details">
              <span class="user-name">{{ auth.currentUser()?.name }}</span>
              <span class="user-role">{{ auth.currentUser()?.role }}</span>
            </div>
          </div>
          <button mat-list-item class="logout-btn" (click)="auth.logout()">
            <mat-icon>logout</mat-icon>
            <span>Sair</span>
          </button>
        </div>
      </mat-sidenav>

      <mat-sidenav-content class="main-content">
        <mat-toolbar class="toolbar">
          <span class="page-title">{{ getPageTitle() }}</span>
          <span class="spacer"></span>
          <button mat-icon-button [matMenuTriggerFor]="userMenu">
            <div class="avatar-btn">{{ initials() }}</div>
          </button>
          <mat-menu #userMenu="matMenu">
            <div class="menu-header">
              <strong>{{ auth.currentUser()?.name }}</strong>
              <small>{{ auth.currentUser()?.email }}</small>
            </div>
            <mat-divider></mat-divider>
            <button mat-menu-item (click)="auth.logout()">
              <mat-icon>logout</mat-icon>
              Sair
            </button>
          </mat-menu>
        </mat-toolbar>

        <div class="content">
          <router-outlet />
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .sidenav-container { height: 100vh; }

    .sidenav {
      width: 240px;
      background: #1a237e;
      color: white;
      display: flex;
      flex-direction: column;
    }

    .sidenav-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 24px 16px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .brand-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      color: #90caf9;
    }
    .brand-name {
      font-size: 15px;
      font-weight: 700;
      color: white;
    }

    .nav-list { flex: 1; padding-top: 8px; }
    .nav-list a {
      color: rgba(255,255,255,0.8) !important;
      margin: 4px 8px;
      border-radius: 8px;
    }
    .nav-list a:hover { background: rgba(255,255,255,0.1) !important; }
    .nav-list a.active-link {
      background: rgba(255,255,255,0.2) !important;
      color: white !important;
    }
    .nav-list mat-icon { color: rgba(255,255,255,0.7) !important; }
    .nav-list a.active-link mat-icon { color: #90caf9 !important; }

    .sidenav-footer {
      padding-bottom: 8px;
    }
    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
    }
    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #1565c0;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 700;
      flex-shrink: 0;
    }
    .user-details {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .user-name {
      font-size: 13px;
      font-weight: 600;
      color: white;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .user-role {
      font-size: 11px;
      color: rgba(255,255,255,0.6);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .logout-btn {
      display: flex !important;
      align-items: center;
      gap: 8px;
      color: rgba(255,255,255,0.7) !important;
      padding: 8px 16px;
      cursor: pointer;
      width: 100%;
      background: transparent;
      border: none;
      font-size: 14px;
    }
    .logout-btn:hover { background: rgba(255,255,255,0.1); color: white !important; }

    .toolbar {
      background: white;
      box-shadow: 0 1px 4px rgba(0,0,0,0.1);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .page-title { font-size: 18px; font-weight: 600; color: #1a237e; }
    .spacer { flex: 1; }
    .avatar-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #1565c0;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 700;
    }
    .menu-header {
      padding: 12px 16px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .menu-header strong { font-size: 14px; }
    .menu-header small { font-size: 12px; color: #666; }

    .main-content { background: #f5f7fb; }
    .content { padding: 24px; }
  `],
})
export class LayoutComponent {
  auth = inject(AuthService);

  initials(): string {
    const name = this.auth.currentUser()?.name ?? '';
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  getPageTitle(): string {
    const path = window.location.pathname;
    if (path.includes('admin/users')) return 'Gerenciar Usuários';
    return 'Gerenciar API Keys';
  }
}
