import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/auth.model';
import { ChangeRoleDialogComponent } from './change-role-dialog.component';
import { CreateOperatorDialogComponent } from './create-operator-dialog.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule, MatTableModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatMenuModule, MatProgressSpinnerModule,
    MatSnackBarModule, MatTooltipModule, MatDialogModule,
  ],
  template: `
    <div class="page-header">
      <div>
        <h2>Usuários</h2>
        <p>Gerencie usuários e permissões do sistema</p>
      </div>
      <button mat-raised-button color="primary" (click)="openCreateOperator()">
        <mat-icon>person_add</mat-icon> Novo Operador
      </button>
    </div>

    <mat-card class="users-card" *ngIf="!loading(); else loadingTpl">
      <mat-card-content>
        <table mat-table [dataSource]="users()" class="users-table">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Usuário</th>
            <td mat-cell *matCellDef="let user">
              <div class="user-cell">
                <div class="avatar">{{ initials(user) }}</div>
                <div>
                  <strong>{{ user.name }}</strong>
                  <div class="email">{{ user.email }}</div>
                </div>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="role">
            <th mat-header-cell *matHeaderCellDef>Papel</th>
            <td mat-cell *matCellDef="let user">
              <span class="role-badge" [class.admin]="user.role === 'admin'" [class.operator]="user.role === 'operator'">
                <mat-icon class="role-icon">{{ user.role === 'admin' ? 'admin_panel_settings' : 'manage_accounts' }}</mat-icon>
                {{ user.role === 'admin' ? 'Administrador' : 'Operador' }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="created_at">
            <th mat-header-cell *matHeaderCellDef>Cadastrado em</th>
            <td mat-cell *matCellDef="let user">{{ user.created_at | date:'dd/MM/yyyy' }}</td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Ações</th>
            <td mat-cell *matCellDef="let user">
              <button mat-icon-button [matMenuTriggerFor]="menu"
                      [disabled]="user.id === currentUser()?.id"
                      [matTooltip]="user.id === currentUser()?.id ? 'Você não pode alterar seu próprio papel' : 'Opções'">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #menu="matMenu">
                <button mat-menu-item (click)="openChangeRole(user)" *ngIf="user.role !== 'admin'">
                  <mat-icon>admin_panel_settings</mat-icon>
                  Promover a Admin
                </button>
                <button mat-menu-item (click)="openChangeRole(user)" *ngIf="user.role === 'admin'">
                  <mat-icon>manage_accounts</mat-icon>
                  Rebaixar para Operador
                </button>
              </mat-menu>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"
              [class.current-user-row]="row.id === currentUser()?.id"></tr>
        </table>
      </mat-card-content>
    </mat-card>

    <ng-template #loadingTpl>
      <div class="loading-center"><mat-spinner></mat-spinner></div>
    </ng-template>
  `,
  styles: [`
    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 24px;
    }
    .page-header h2 { margin: 0 0 4px; font-size: 24px; font-weight: 700; color: #1a237e; }
    .page-header p { margin: 0; color: #666; }
    .users-card { border-radius: 12px; }
    .users-table { width: 100%; }
    .user-cell { display: flex; align-items: center; gap: 12px; padding: 4px 0; }
    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #1565c0;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 700;
      flex-shrink: 0;
    }
    .email { font-size: 12px; color: #888; }
    .role-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }
    .role-badge.admin { background: #e8eaff; color: #1a237e; }
    .role-badge.operator { background: #e8f5e9; color: #2e7d32; }
    .role-icon { font-size: 16px; width: 16px; height: 16px; }
    .current-user-row { background: #f8f9ff; }
    .loading-center { display: flex; justify-content: center; padding: 60px; }
  `],
})
export class UsersComponent implements OnInit {
  private userService = inject(UserService);
  private auth = inject(AuthService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  users = signal<User[]>([]);
  loading = signal(true);
  displayedColumns = ['name', 'role', 'created_at', 'actions'];
  currentUser = this.auth.currentUser;

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.userService.list().subscribe({
      next: (users) => { this.users.set(users); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openCreateOperator(): void {
    const ref = this.dialog.open(CreateOperatorDialogComponent, { width: '440px', disableClose: true });
    ref.afterClosed().subscribe((user) => {
      if (!user) return;
      this.snackBar.open(`Operador "${user.name}" criado com sucesso`, 'OK', { duration: 3000 });
      this.loadUsers();
    });
  }

  openChangeRole(user: User): void {
    const newRole: 'admin' | 'operator' = user.role === 'admin' ? 'operator' : 'admin';
    const ref = this.dialog.open(ChangeRoleDialogComponent, {
      width: '400px',
      data: { user, newRole },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.userService.changeRole(user.id, newRole).subscribe({
        next: () => {
          this.snackBar.open(`Papel de ${user.name} alterado para ${newRole}`, 'OK', { duration: 3000 });
          this.loadUsers();
        },
        error: (err) => {
          this.snackBar.open(err.error?.error || 'Erro ao alterar papel', 'OK', { duration: 4000 });
        },
      });
    });
  }

  initials(user: User): string {
    return user.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }
}
