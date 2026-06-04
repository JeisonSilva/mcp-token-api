import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ApiKeyService } from '../../core/services/apikey.service';

const AVAILABLE_SCOPES = [
  { value: 'read', label: 'Leitura', description: 'Permite consultar recursos' },
  { value: 'write', label: 'Escrita', description: 'Permite criar e atualizar recursos' },
  { value: 'delete', label: 'Exclusão', description: 'Permite remover recursos' },
  { value: 'admin', label: 'Admin', description: 'Acesso total de administrador' },
];

@Component({
  selector: 'app-create-apikey-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatCheckboxModule, MatIconModule,
    MatProgressSpinnerModule, MatChipsModule,
    MatDatepickerModule, MatNativeDateModule,
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon style="vertical-align:middle;margin-right:8px">add_circle</mat-icon>
      Nova API Key
    </h2>

    <mat-dialog-content>
      <form [formGroup]="form" id="create-form" (ngSubmit)="submit()">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nome da chave</mat-label>
          <input matInput formControlName="name" placeholder="Ex: Produção, CI/CD, Teste..." />
          <mat-hint>Identifique onde esta chave será usada</mat-hint>
          <mat-error *ngIf="form.get('name')?.hasError('required')">Nome obrigatório</mat-error>
          <mat-error *ngIf="form.get('name')?.hasError('minlength')">Mínimo 2 caracteres</mat-error>
        </mat-form-field>

        <div class="scopes-label">Escopos <span class="required">*</span></div>
        <div class="scopes-grid">
          <label *ngFor="let scope of availableScopes" class="scope-item"
                 [class.selected]="isScopeSelected(scope.value)">
            <mat-checkbox
              [checked]="isScopeSelected(scope.value)"
              (change)="toggleScope(scope.value, $event.checked)">
            </mat-checkbox>
            <div class="scope-info">
              <span class="scope-name">{{ scope.label }}</span>
              <span class="scope-desc">{{ scope.description }}</span>
            </div>
          </label>
        </div>
        <div *ngIf="scopeError" class="scope-error">Selecione pelo menos um escopo</div>

        <mat-form-field appearance="outline" class="full-width" style="margin-top:16px">
          <mat-label>Expiração (opcional)</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="expires_at" [min]="minDate" />
          <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
          <mat-hint>Deixe em branco para não expirar</mat-hint>
        </mat-form-field>

        <div *ngIf="errorMessage" class="error-banner">
          <mat-icon>error_outline</mat-icon> {{ errorMessage }}
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close [disabled]="loading">Cancelar</button>
      <button mat-raised-button color="primary" form="create-form" type="submit" [disabled]="loading">
        <mat-spinner *ngIf="loading" diameter="18" style="display:inline-block;margin-right:6px"></mat-spinner>
        <span *ngIf="!loading"><mat-icon style="font-size:18px;vertical-align:middle">add</mat-icon> Criar</span>
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; }
    .scopes-label { font-size: 14px; color: rgba(0,0,0,0.6); margin-bottom: 8px; font-weight: 500; }
    .required { color: #f44336; }
    .scopes-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .scope-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 10px 12px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .scope-item:hover { border-color: #1565c0; background: #f0f4ff; }
    .scope-item.selected { border-color: #1565c0; background: #e8eeff; }
    .scope-info { display: flex; flex-direction: column; }
    .scope-name { font-size: 13px; font-weight: 600; color: #333; }
    .scope-desc { font-size: 11px; color: #888; }
    .scope-error { color: #f44336; font-size: 12px; margin: 4px 0 8px; }
    .error-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #ffebee;
      color: #c62828;
      border-radius: 8px;
      padding: 10px 14px;
      margin-top: 12px;
      font-size: 14px;
    }
    mat-dialog-content { min-width: 400px; }
  `],
})
export class CreateApiKeyDialogComponent {
  private fb = inject(FormBuilder);
  private apiKeyService = inject(ApiKeyService);
  private dialogRef = inject(MatDialogRef<CreateApiKeyDialogComponent>);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    expires_at: [null as Date | null],
  });
  selectedScopes: Set<string> = new Set(['read']);
  availableScopes = AVAILABLE_SCOPES;
  loading = false;
  scopeError = false;
  errorMessage = '';
  minDate = new Date();

  isScopeSelected(scope: string): boolean {
    return this.selectedScopes.has(scope);
  }

  toggleScope(scope: string, checked: boolean): void {
    if (checked) this.selectedScopes.add(scope);
    else this.selectedScopes.delete(scope);
    this.scopeError = false;
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (this.selectedScopes.size === 0) { this.scopeError = true; return; }

    this.loading = true;
    this.errorMessage = '';
    const { name, expires_at } = this.form.value;
    const body = {
      name: name!,
      scopes: Array.from(this.selectedScopes),
      ...(expires_at ? { expires_at: (expires_at as Date).toISOString() } : {}),
    };

    this.apiKeyService.create(body).subscribe({
      next: (res) => this.dialogRef.close({ rawKey: res.rawKey, name: res.apiKey.name }),
      error: (err) => {
        this.errorMessage = err.error?.error || 'Erro ao criar API Key';
        this.loading = false;
      },
    });
  }
}
