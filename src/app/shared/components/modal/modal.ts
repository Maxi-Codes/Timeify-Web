import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  templateUrl: './modal.html',
})
export class ModalComponent {
  open = input(false);
  title = input('');
  closed = output<void>();

  onBackdropClick(): void {
    this.closed.emit();
  }
}
