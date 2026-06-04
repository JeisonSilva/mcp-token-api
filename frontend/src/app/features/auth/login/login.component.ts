import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="auth-page">
      <mat-card class="auth-card">
        <mat-card-header>
          <div class="logo">
            <mat-icon>vpn_key</mat-icon>
            <h1>MCP Token API</h1>
          </div>
          <mat-card-title>Entrar</mat-card-title>
          <mat-card-subtitle>Acesse sua conta para gerenciar API Keys</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>E-mail</mat-label>
              <input matInput formControlName="email" type="email" placeholder="seu@email.com" />
              <mat-icon matSuffix>email</mat-icon>
              <mat-error *ngIf="form.get('email')?.hasError('required')">E-mail obrigatório</mat-error>
              <mat-error *ngIf="form.get('email')?.hasError('email')">E-mail inválido</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Senha</mat-label>
              <input matInput formControlName="password" [type]="hidePassword ? 'password' : 'text'" />
              <button mat-icon-button matSuffix type="button" (click)="hidePassword = !hidePassword">
                <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              <mat-error *ngIf="form.get('password')?.hasError('required')">Senha obrigatória</mat-error>
            </mat-form-field>

            <div *ngIf="errorMessage" class="error-banner">
              <mat-icon>error_outline</mat-icon> {{ errorMessage }}
            </div>

            <button mat-raised-button color="primary" type="submit" class="full-width submit-btn"
                    [disabled]="loading">
              <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
              <span *ngIf="!loading">Entrar</span>
            </button>
          </form>
        </mat-card-content>

        <mat-card-actions>
          <p class="center-text">
            Não tem conta? <a routerLink="/register">Cadastre-se</a>
          </p>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1a237e 0%, #283593 50%, #1565c0 100%);
      padding: 16px;
    }
    .auth-card {
      width: 100%;
      max-width: 420px;
      border-radius: 16px;
      padding: 24px;
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
      width: 100%;
    }
    .logo mat-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
      color: #1565c0;
    }
    .logo h1 {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      color: #1565c0;
    }
    mat-card-header {
      flex-direction: column;
      margin-bottom: 8px;
    }
    .full-width { width: 100%; }
    .submit-btn {
      margin-top: 8px;
      height: 48px;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .error-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #ffebee;
      color: #c62828;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 12px;
      font-size: 14px;
    }
    .center-text { text-align: center; width: 100%; margin: 8px 0 0; }
    .center-text a { color: #1565c0; font-weight: 600; text-decoration: none; }
  `],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  loading = false;
  hidePassword = true;
  errorMessage = '';

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.errorMessage = '';
    const { email, password } = this.form.value;
    this.auth.login({ email: email!, password: password! }).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.errorMessage = err.error?.error || 'Credenciais inválidas';
        this.loading = false;
      },
    });
  }
}
