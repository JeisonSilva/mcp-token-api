import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ApiKeyService } from '../../core/services/apikey.service';

@Component({
  selector: 'app-create-apikey-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
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
          <input matInput formControlName="name" placeholder="Ex: Produção, CI/CD, Agente Claude..." />
          <mat-hint>Identifique onde esta chave será usada</mat-hint>
          <mat-error *ngIf="form.get('name')?.hasError('required')">Nome obrigatório</mat-error>
          <mat-error *ngIf="form.get('name')?.hasError('minlength')">Mínimo 2 caracteres</mat-error>
        </mat-form-field>

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
    mat-dialog-content { min-width: 400px; }
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

  loading = false;
  errorMessage = '';
  minDate = new Date();

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.loading = true;
    this.errorMessage = '';
    const { name, expires_at } = this.form.value;
    const body = {
      name: name!,
      ...(expires_at ? { expiresAt: (expires_at as Date).toISOString() } : {}),
    };

    this.apiKeyService.create(body).subscribe({
      next: (res) => this.dialogRef.close({ rawKey: res.key, name: res.name }),
      error: (err) => {
        this.errorMessage = err.error?.error || 'Erro ao criar API Key';
        this.loading = false;
      },
    });
  }
}
