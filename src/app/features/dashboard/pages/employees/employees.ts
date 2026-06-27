import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { User } from '../../../../api/models/user';
import { AuthService } from '../../../../core/auth/auth.service';
import {
  ROLE_LABELS,
  UpdateUserDto,
  UsersService,
} from '../../../../core/services/users.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { ButtonComponent } from '../../../../shared/components/button/button';
import { InputComponent } from '../../../../shared/components/input/input';
import { ModalComponent } from '../../../../shared/components/modal/modal';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonComponent, InputComponent, ModalComponent, ConfirmDialogComponent],
  templateUrl: './employees.html',
})
export class EmployeesPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly usersService = inject(UsersService);
  private readonly auth = inject(AuthService);

  readonly users = signal<User[]>([]);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly modalOpen = signal(false);
  readonly editingUser = signal<User | null>(null);
  readonly errorMessage = signal('');
  readonly deleteConfirmOpen = signal(false);
  readonly infoDialogOpen = signal(false);
  readonly userToDelete = signal<User | null>(null);
  readonly deleteError = signal('');
  readonly isDeleting = signal(false);
  readonly roleLabels = ROLE_LABELS;
  readonly roleOptions = Object.entries(ROLE_LABELS).map(([value, label]) => ({
    value: Number(value),
    label,
  }));

  readonly form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    role: [3, Validators.required],
  });

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.usersService.getAll().subscribe({
      next: (users) => {
        this.users.set(users);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  openCreateModal(): void {
    this.editingUser.set(null);
    this.form.reset({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 3,
    });
    this.form.controls.password.setValidators([
      Validators.required,
      Validators.minLength(8),
    ]);
    this.form.controls.password.updateValueAndValidity();
    this.errorMessage.set('');
    this.modalOpen.set(true);
  }

  openEditModal(user: User): void {
    this.editingUser.set(user);
    this.form.patchValue({
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      email: user.email ?? '',
      password: '',
      role: user.role ?? 3,
    });
    this.form.controls.password.clearValidators();
    this.form.controls.password.updateValueAndValidity();
    this.errorMessage.set('');
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const editing = this.editingUser();
    this.isSaving.set(true);
    this.errorMessage.set('');

    if (editing?.id) {
      const payload: UpdateUserDto = {
        firstName: raw.firstName,
        lastName: raw.lastName,
        email: raw.email,
        role: raw.role,
      };
      if (raw.password) {
        payload.password = raw.password;
      }

      this.usersService.update(editing.id, payload).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.closeModal();
          this.loadUsers();
        },
        error: () => {
          this.isSaving.set(false);
          this.errorMessage.set('Mitarbeiter konnte nicht gespeichert werden.');
        },
      });
      return;
    }

    const companyId = this.auth.getCompanyId();
    if (!companyId) {
      this.isSaving.set(false);
      this.errorMessage.set('Unternehmen nicht gefunden. Bitte erneut anmelden.');
      return;
    }

    this.usersService
      .create({
        companyId,
        firstName: raw.firstName,
        lastName: raw.lastName,
        email: raw.email,
        password: raw.password,
        role: raw.role,
      })
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.closeModal();
          this.loadUsers();
        },
        error: () => {
          this.isSaving.set(false);
          this.errorMessage.set('Mitarbeiter konnte nicht angelegt werden.');
        },
      });
  }

  deleteUser(user: User): void {
    if (!user.id) return;

    if (user.id === this.auth.getUserId()) {
      this.infoDialogOpen.set(true);
      return;
    }

    this.userToDelete.set(user);
    this.deleteError.set('');
    this.deleteConfirmOpen.set(true);
  }

  closeDeleteConfirm(): void {
    this.deleteConfirmOpen.set(false);
    this.userToDelete.set(null);
    this.deleteError.set('');
  }

  confirmDelete(): void {
    const user = this.userToDelete();
    if (!user?.id) return;

    this.isDeleting.set(true);
    this.deleteError.set('');

    this.usersService.delete(user.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.closeDeleteConfirm();
        this.loadUsers();
      },
      error: () => {
        this.isDeleting.set(false);
        this.deleteError.set('Mitarbeiter konnte nicht gelöscht werden.');
      },
    });
  }

  deleteConfirmMessage(): string {
    const user = this.userToDelete();
    if (!user) return '';
    return `Möchtest du den Mitarbeiter „${user.firstName} ${user.lastName}" wirklich löschen?`;
  }

  roleName(role?: number): string {
    if (role === undefined || role === null) return '—';
    return ROLE_LABELS[role] ?? 'Unbekannt';
  }

  fieldError(field: 'firstName' | 'lastName' | 'email' | 'password'): string {
    const control = this.form.controls[field];
    if (!control.touched || !control.errors) return '';
    if (control.errors['required']) return 'Pflichtfeld';
    if (field === 'email' && control.errors['email']) return 'Ungültige E-Mail';
    if (field === 'password' && control.errors['minlength']) {
      return 'Mindestens 8 Zeichen';
    }
    return '';
  }
}
