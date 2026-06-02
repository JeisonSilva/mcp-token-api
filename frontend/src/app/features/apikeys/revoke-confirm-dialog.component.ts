import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-revoke-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>
      <mat-icon style="color:#c62828;vertical-align:middle;margin-right:8px">warning</mat-icon>
      Revogar API Key
    </h2>
    <mat-dialog-content>
      <p>Tem certeza que deseja revogar a chave <strong>"{{ data.name }}"</strong>?</p>
      <p style="color:#888;font-size:13px">
        Esta ação é <strong>irreversível</strong>. Todas as requisições usando esta chave serão rejeitadas imediatamente.
      </p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">Cancelar</button>
      <button mat-raised-button color="warn" [mat-dialog-close]="true">
        <mat-icon>block</mat-icon> Revogar
      </button>
    </mat-dialog-actions>
  `,
})
export class RevokeConfirmDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { name: string }) {}
}
