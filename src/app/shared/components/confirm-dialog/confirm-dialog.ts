import { Component, input, output } from '@angular/core';
import { ButtonComponent } from '../button/button';
import { ModalComponent } from '../modal/modal';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [ModalComponent, ButtonComponent],
  templateUrl: './confirm-dialog.html',
})
export class ConfirmDialogComponent {
  open = input(false);
  title = input('Bestätigen');
  message = input('');
  error = input('');
  confirmLabel = input('Bestätigen');
  cancelLabel = input('Abbrechen');
  showCancel = input(true);
  variant = input<'danger' | 'primary'>('primary');
  isLoading = input(false);

  confirmed = output<void>();
  cancelled = output<void>();

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
