import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { User } from '../../../core/models/auth.model';

@Component({
  selector: 'app-change-role-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>
      <mat-icon style="vertical-align:middle;margin-right:8px">manage_accounts</mat-icon>
      Alterar Papel
    </h2>
    <mat-dialog-content>
      <p>
        Alterar o papel de <strong>{{ data.user.name }}</strong> de
        <strong>{{ data.user.role }}</strong> para <strong>{{ data.newRole }}</strong>?
      </p>
      <p *ngIf="data.newRole === 'admin'" style="color:#e65100;font-size:13px">
        Administradores têm acesso total ao sistema, incluindo gerenciamento de usuários.
      </p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">Cancelar</button>
      <button mat-raised-button [color]="data.newRole === 'admin' ? 'primary' : 'warn'" [mat-dialog-close]="true">
        <mat-icon>{{ data.newRole === 'admin' ? 'admin_panel_settings' : 'manage_accounts' }}</mat-icon>
        Confirmar
      </button>
    </mat-dialog-actions>
  `,
})
export class ChangeRoleDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { user: User; newRole: 'admin' | 'operator' }) {}
}
