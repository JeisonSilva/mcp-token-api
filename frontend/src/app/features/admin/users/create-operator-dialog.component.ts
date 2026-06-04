import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-create-operator-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon style="vertical-align:middle;margin-right:8px">person_add</mat-icon>
      Novo Operador
    </h2>

    <mat-dialog-content>
      <form [formGroup]="form" id="create-operator-form" (ngSubmit)="submit()">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nome</mat-label>
          <input matInput formControlName="name" />
          <mat-error *ngIf="form.get('name')?.hasError('required')">Nome obrigatório</mat-error>
          <mat-error *ngIf="form.get('name')?.hasError('minlength')">Mínimo 2 caracteres</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>E-mail</mat-label>
          <input matInput formControlName="email" type="email" />
          <mat-error *ngIf="form.get('email')?.hasError('required')">E-mail obrigatório</mat-error>
          <mat-error *ngIf="form.get('email')?.hasError('email')">E-mail inválido</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Senha</mat-label>
          <input matInput formControlName="password" [type]="showPassword ? 'text' : 'password'" />
          <button mat-icon-button matSuffix type="button" (click)="showPassword = !showPassword">
            <mat-icon>{{ showPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          <mat-hint>Mínimo 8 caracteres</mat-hint>
          <mat-error *ngIf="form.get('password')?.hasError('required')">Senha obrigatória</mat-error>
          <mat-error *ngIf="form.get('password')?.hasError('minlength')">Mínimo 8 caracteres</mat-error>
        </mat-form-field>

        <div *ngIf="errorMessage" class="error-banner">
          <mat-icon>error_outline</mat-icon> {{ errorMessage }}
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close [disabled]="loading">Cancelar</button>
      <button mat-raised-button color="primary" form="create-operator-form" type="submit" [disabled]="loading">
        <mat-spinner *ngIf="loading" diameter="18" style="display:inline-block;margin-right:6px"></mat-spinner>
        <span *ngIf="!loading"><mat-icon style="font-size:18px;vertical-align:middle">person_add</mat-icon> Criar</span>
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; margin-bottom: 4px; }
    mat-dialog-content { min-width: 380px; display: flex; flex-direction: column; gap: 4px; }
    .error-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #ffebee;
      color: #c62828;
      border-radius: 8px;
      padding: 10px 14px;
      margin-top: 8px;
      font-size: 14px;
    }
  `],
})
export class CreateOperatorDialogComponent {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private dialogRef = inject(MatDialogRef<CreateOperatorDialogComponent>);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  loading = false;
  showPassword = false;
  errorMessage = '';

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.loading = true;
    this.errorMessage = '';
    const { name, email, password } = this.form.value;

    this.userService.createOperator(name!, email!, password!).subscribe({
      next: (user) => this.dialogRef.close(user),
      error: (err) => {
        this.errorMessage = err.error?.error || 'Erro ao criar operador';
        this.loading = false;
      },
    });
  }
}
