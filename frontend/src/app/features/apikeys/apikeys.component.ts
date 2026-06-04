import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ApiKeyService } from '../../core/services/apikey.service';
import { ApiKey } from '../../core/models/apikey.model';
import { CreateApiKeyDialogComponent } from './create-apikey-dialog.component';
import { RevokeConfirmDialogComponent } from './revoke-confirm-dialog.component';
import { ShowKeyDialogComponent } from './show-key-dialog.component';

@Component({
  selector: 'app-apikeys',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatTableModule,
    MatChipsModule, MatDialogModule, MatFormFieldModule, MatInputModule,
    MatCheckboxModule, MatProgressSpinnerModule, MatTooltipModule,
    MatSnackBarModule, MatDividerModule, MatDatepickerModule, MatNativeDateModule,
  ],
  template: `
    <div class="page-header">
      <div>
        <h2>API Keys</h2>
        <p>Crie e gerencie suas chaves de acesso à API</p>
      </div>
      <button mat-raised-button color="primary" (click)="openCreateDialog()">
        <mat-icon>add</mat-icon> Nova API Key
      </button>
    </div>

    <mat-card class="keys-card" *ngIf="!loading(); else loadingTpl">
      <mat-card-content>
        <div *ngIf="keys().length === 0" class="empty-state">
          <mat-icon>vpn_key_off</mat-icon>
          <h3>Nenhuma API Key criada</h3>
          <p>Clique em "Nova API Key" para criar sua primeira chave</p>
        </div>

        <table mat-table [dataSource]="activeKeys()" *ngIf="activeKeys().length > 0" class="keys-table">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Nome</th>
            <td mat-cell *matCellDef="let key">
              <strong>{{ key.name }}</strong>
              <div class="key-prefix">{{ key.key_prefix }}...</div>
            </td>
          </ng-container>

          <ng-container matColumnDef="created_at">
            <th mat-header-cell *matHeaderCellDef>Criado em</th>
            <td mat-cell *matCellDef="let key">{{ key.created_at | date:'dd/MM/yyyy HH:mm' }}</td>
          </ng-container>

          <ng-container matColumnDef="last_used">
            <th mat-header-cell *matHeaderCellDef>Último uso</th>
            <td mat-cell *matCellDef="let key">
              <span *ngIf="key.last_used_at">{{ key.last_used_at | date:'dd/MM/yyyy HH:mm' }}</span>
              <span *ngIf="!key.last_used_at" class="never-used">Nunca usada</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="expires_at">
            <th mat-header-cell *matHeaderCellDef>Expira em</th>
            <td mat-cell *matCellDef="let key">
              <span *ngIf="key.expires_at" [class.expired]="isExpired(key)">
                {{ key.expires_at | date:'dd/MM/yyyy' }}
              </span>
              <span *ngIf="!key.expires_at" class="no-expiry">Sem expiração</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let key">
              <span class="status-badge" [class.active]="!isExpired(key)" [class.expired]="isExpired(key)">
                {{ isExpired(key) ? 'Expirada' : 'Ativa' }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Ações</th>
            <td mat-cell *matCellDef="let key">
              <button mat-icon-button color="warn" matTooltip="Revogar chave"
                      (click)="openRevokeDialog(key)" [disabled]="revokingId() === key.id">
                <mat-spinner *ngIf="revokingId() === key.id" diameter="20"></mat-spinner>
                <mat-icon *ngIf="revokingId() !== key.id">block</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>

        <!-- Revogadas -->
        <div *ngIf="revokedKeys().length > 0" class="revoked-section">
          <button mat-button (click)="showRevoked = !showRevoked" class="toggle-revoked">
            <mat-icon>{{ showRevoked ? 'expand_less' : 'expand_more' }}</mat-icon>
            {{ showRevoked ? 'Ocultar' : 'Ver' }} chaves revogadas ({{ revokedKeys().length }})
          </button>

          <table mat-table [dataSource]="revokedKeys()" *ngIf="showRevoked" class="keys-table revoked-table">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Nome</th>
              <td mat-cell *matCellDef="let key">
                <strong>{{ key.name }}</strong>
                <div class="key-prefix">{{ key.key_prefix }}...</div>
              </td>
            </ng-container>
            <ng-container matColumnDef="created_at">
              <th mat-header-cell *matHeaderCellDef>Criado em</th>
              <td mat-cell *matCellDef="let key">{{ key.created_at | date:'dd/MM/yyyy HH:mm' }}</td>
            </ng-container>
            <ng-container matColumnDef="last_used">
              <th mat-header-cell *matHeaderCellDef>Último uso</th>
              <td mat-cell *matCellDef="let key">
                <span *ngIf="key.last_used_at">{{ key.last_used_at | date:'dd/MM/yyyy HH:mm' }}</span>
                <span *ngIf="!key.last_used_at" class="never-used">Nunca usada</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="expires_at">
              <th mat-header-cell *matHeaderCellDef>Expirou em</th>
              <td mat-cell *matCellDef="let key">{{ key.revoked_at | date:'dd/MM/yyyy HH:mm' }}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let key">
                <span class="status-badge revoked">Revogada</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let key"></td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="revoked-row"></tr>
          </table>
        </div>
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
    .keys-card { border-radius: 12px; }
    .keys-table { width: 100%; }
    .key-prefix { font-family: monospace; font-size: 12px; color: #888; margin-top: 2px; }
    .scope-chip { font-size: 11px !important; height: 22px !important; background: #e3f2fd !important; color: #1565c0 !important; }
    .never-used { color: #bbb; font-style: italic; }
    .no-expiry { color: #bbb; font-style: italic; }
    .expired { color: #f44336; font-weight: 600; }
    .status-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }
    .status-badge.active { background: #e8f5e9; color: #2e7d32; }
    .status-badge.expired { background: #fff3e0; color: #e65100; }
    .status-badge.revoked { background: #ffebee; color: #c62828; }
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #aaa;
    }
    .empty-state mat-icon { font-size: 64px; width: 64px; height: 64px; margin-bottom: 16px; }
    .empty-state h3 { margin: 0 0 8px; color: #666; }
    .revoked-section { margin-top: 24px; }
    .toggle-revoked { color: #888; }
    .revoked-table { opacity: 0.7; }
    .revoked-row td { text-decoration: line-through; color: #aaa; }
    .loading-center { display: flex; justify-content: center; padding: 60px; }
  `],
})
export class ApiKeysComponent implements OnInit {
  keys = signal<ApiKey[]>([]);
  loading = signal(true);
  revokingId = signal<number | null>(null);
  showRevoked = false;

  displayedColumns = ['name', 'created_at', 'last_used', 'expires_at', 'status', 'actions'];

  activeKeys = () => this.keys().filter(k => !k.revoked_at);
  revokedKeys = () => this.keys().filter(k => !!k.revoked_at);

  constructor(
    private apiKeyService: ApiKeyService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.loadKeys();
  }

  loadKeys(): void {
    this.loading.set(true);
    this.apiKeyService.list().subscribe({
      next: (keys) => { this.keys.set(keys); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(CreateApiKeyDialogComponent, { width: '480px', disableClose: true });
    ref.afterClosed().subscribe((result) => {
      if (result?.rawKey) {
        this.loadKeys();
        this.dialog.open(ShowKeyDialogComponent, {
          width: '520px',
          disableClose: true,
          data: { rawKey: result.rawKey, name: result.name },
        });
      }
    });
  }

  openRevokeDialog(key: ApiKey): void {
    const ref = this.dialog.open(RevokeConfirmDialogComponent, {
      width: '400px',
      data: { name: key.name },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.revokingId.set(key.id);
      this.apiKeyService.revoke(key.id).subscribe({
        next: () => {
          this.revokingId.set(null);
          this.snackBar.open(`API Key "${key.name}" revogada`, 'OK', { duration: 3000 });
          this.loadKeys();
        },
        error: () => {
          this.revokingId.set(null);
          this.snackBar.open('Erro ao revogar chave', 'OK', { duration: 4000, panelClass: 'error-snack' });
        },
      });
    });
  }

  isExpired(key: ApiKey): boolean {
    return !!key.expires_at && new Date(key.expires_at) < new Date();
  }
}
