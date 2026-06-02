import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-show-key-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatSnackBarModule, MatTooltipModule],
  template: `
    <h2 mat-dialog-title>
      <mat-icon style="color:#2e7d32;vertical-align:middle;margin-right:8px">check_circle</mat-icon>
      API Key criada com sucesso!
    </h2>

    <mat-dialog-content>
      <div class="warning-box">
        <mat-icon>warning</mat-icon>
        <div>
          <strong>Atenção!</strong> Copie a chave agora.
          Esta é a <strong>única vez</strong> que ela será exibida — não é possível recuperá-la depois.
        </div>
      </div>

      <div class="key-label">Sua API Key: <strong>{{ data.name }}</strong></div>
      <div class="key-box">
        <code class="key-value">{{ data.rawKey }}</code>
        <button mat-icon-button (click)="copy()" [matTooltip]="copied ? 'Copiado!' : 'Copiar'">
          <mat-icon>{{ copied ? 'check' : 'content_copy' }}</mat-icon>
        </button>
      </div>
      <p class="hint">Use esta chave no header: <code>X-Api-Key: {{ data.rawKey }}</code></p>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-raised-button color="primary" mat-dialog-close>
        <mat-icon>done</mat-icon> Já copiei, fechar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .warning-box {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      background: #fff8e1;
      border: 1px solid #ffca28;
      border-radius: 8px;
      padding: 14px;
      margin-bottom: 20px;
    }
    .warning-box mat-icon { color: #f57f17; flex-shrink: 0; }
    .key-label { font-size: 13px; color: #666; margin-bottom: 8px; }
    .key-box {
      display: flex;
      align-items: center;
      background: #f5f5f5;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 12px 8px 12px 16px;
      gap: 8px;
    }
    .key-value {
      font-family: monospace;
      font-size: 13px;
      word-break: break-all;
      flex: 1;
      color: #1a237e;
    }
    .hint { font-size: 12px; color: #888; margin-top: 12px; }
    .hint code { background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-size: 11px; word-break: break-all; }
    mat-dialog-content { min-width: 420px; }
  `],
})
export class ShowKeyDialogComponent {
  copied = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { rawKey: string; name: string },
    private snackBar: MatSnackBar,
  ) {}

  copy(): void {
    navigator.clipboard.writeText(this.data.rawKey).then(() => {
      this.copied = true;
      this.snackBar.open('Chave copiada!', '', { duration: 2000 });
      setTimeout(() => (this.copied = false), 3000);
    });
  }
}
