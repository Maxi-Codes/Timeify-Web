import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Absence } from '../../../../api/models/absence';
import { AbsenceStatus } from '../../../../api/models/absence-status';
import { AbsenceType } from '../../../../api/models/absence-type';
import { User } from '../../../../api/models/user';
import { AbsencesService } from '../../../../core/services/absences.service';
import { UsersService } from '../../../../core/services/users.service';
import {
  ABSENCE_STATUS_LABELS,
  ABSENCE_TYPE_LABELS,
  absenceUserName,
  calendarCells,
  calendarWeekdayLabels,
  employeeColor,
} from '../../../../core/utils/absence.util';
import { ButtonComponent } from '../../../../shared/components/button/button';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog';

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';
type TypeFilter = 'all' | AbsenceType;

@Component({
  selector: 'app-absences',
  standalone: true,
  imports: [DatePipe, ButtonComponent, ConfirmDialogComponent],
  templateUrl: './absences.html',
})
export class AbsencesPage implements OnInit {
  private readonly absencesService = inject(AbsencesService);
  private readonly usersService = inject(UsersService);

  readonly isLoading = signal(true);
  readonly loadError = signal('');
  readonly absences = signal<Absence[]>([]);
  readonly users = signal<User[]>([]);
  readonly typeFilter = signal<TypeFilter>('all');
  readonly statusFilter = signal<StatusFilter>('all');

  readonly calendarYear = signal(new Date().getFullYear());
  readonly calendarMonth = signal(new Date().getMonth() + 1);
  readonly calendarDays = computed(() => calendarCells(this.calendarYear(), this.calendarMonth()));
  readonly weekdayLabels = calendarWeekdayLabels();
  readonly monthLabel = computed(() =>
    new Date(this.calendarYear(), this.calendarMonth() - 1, 1).toLocaleDateString('de-DE', {
      month: 'long',
      year: 'numeric',
    }),
  );

  readonly confirmOpen = signal(false);
  readonly confirmAction = signal<'approve' | 'reject' | null>(null);
  readonly selectedAbsence = signal<Absence | null>(null);
  readonly isProcessing = signal(false);
  readonly actionError = signal('');

  readonly filteredAbsences = computed(() => {
    const type = this.typeFilter();
    const status = this.statusFilter();

    return this.absences().filter((absence) => {
      if (type !== 'all' && absence.type !== type) return false;
      if (status === 'pending') return absence.status === 0;
      if (status === 'approved') return absence.status === 1;
      if (status === 'rejected') return absence.status === 2;
      return true;
    });
  });

  readonly pendingCount = computed(
    () => this.absences().filter((absence) => absence.status === 0).length,
  );
  readonly approvedCount = computed(
    () => this.absences().filter((absence) => absence.status === 1).length,
  );

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.loadError.set('');

    this.usersService.getAll().subscribe({
      next: (users) => this.users.set(users),
    });

    this.absencesService.getAll().subscribe({
      next: (absences) => {
        this.absences.set(absences);
        this.isLoading.set(false);
      },
      error: () => {
        this.loadError.set('Abwesenheiten konnten nicht geladen werden.');
        this.isLoading.set(false);
      },
    });
  }

  setTypeFilter(filter: TypeFilter): void {
    this.typeFilter.set(filter);
  }

  setStatusFilter(filter: StatusFilter): void {
    this.statusFilter.set(filter);
  }

  userName(absence: Absence): string {
    return absenceUserName(absence, this.users());
  }

  typeLabel(type?: AbsenceType): string {
    if (type === undefined || type === null) return 'Abwesenheit';
    return ABSENCE_TYPE_LABELS[type] ?? 'Abwesenheit';
  }

  typeIcon(type?: AbsenceType): string {
    switch (type) {
      case 0:
        return '🏝️';
      case 1:
        return '🤧';
      case 2:
        return '🕒';
      case 3:
        return '⭐';
      default:
        return '📌';
    }
  }

  statusLabel(status?: AbsenceStatus): string {
    if (status === undefined || status === null) return '—';
    return ABSENCE_STATUS_LABELS[status] ?? '—';
  }

  statusClass(status?: AbsenceStatus): string {
    switch (status) {
      case 0:
        return 'bg-amber-100 text-amber-800';
      case 1:
        return 'bg-green-100 text-green-700';
      case 2:
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  }

  openConfirm(absence: Absence, action: 'approve' | 'reject'): void {
    this.selectedAbsence.set(absence);
    this.confirmAction.set(action);
    this.actionError.set('');
    this.confirmOpen.set(true);
  }

  closeConfirm(): void {
    this.confirmOpen.set(false);
    this.selectedAbsence.set(null);
    this.confirmAction.set(null);
    this.actionError.set('');
  }

  confirmTitle(): string {
    const absence = this.selectedAbsence();
    const type = this.typeLabel(absence?.type);
    return this.confirmAction() === 'approve' ? `${type} genehmigen` : `${type} ablehnen`;
  }

  confirmMessage(): string {
    const absence = this.selectedAbsence();
    if (!absence) return '';
    const action = this.confirmAction() === 'approve' ? 'genehmigen' : 'ablehnen';
    return `Möchtest du ${this.typeLabel(absence.type).toLowerCase()} von ${this.userName(absence)} wirklich ${action}?`;
  }

  executeConfirm(): void {
    const absence = this.selectedAbsence();
    const action = this.confirmAction();
    if (!absence?.id || !action) return;

    const status: AbsenceStatus = action === 'approve' ? 1 : 2;
    this.isProcessing.set(true);
    this.actionError.set('');

    this.absencesService.updateStatus(absence.id, status).subscribe({
      next: (updated) => {
        this.absences.update((items) =>
          items.map((item) => (item.id === updated.id ? updated : item)),
        );
        this.isProcessing.set(false);
        this.closeConfirm();
      },
      error: () => {
        this.isProcessing.set(false);
        this.actionError.set('Status konnte nicht aktualisiert werden.');
      },
    });
  }

  prevMonth(): void {
    if (this.calendarMonth() === 1) {
      this.calendarMonth.set(12);
      this.calendarYear.update((year) => year - 1);
      return;
    }
    this.calendarMonth.update((month) => month - 1);
  }

  nextMonth(): void {
    if (this.calendarMonth() === 12) {
      this.calendarMonth.set(1);
      this.calendarYear.update((year) => year + 1);
      return;
    }
    this.calendarMonth.update((month) => month + 1);
  }

  absencesForDay(day: number): Absence[] {
    const date = `${this.calendarYear()}-${String(this.calendarMonth()).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    return this.absences().filter((absence) => {
      if (absence.status !== 1 || !absence.startDate || !absence.endDate) return false;
      return date >= absence.startDate.slice(0, 10) && date <= absence.endDate.slice(0, 10);
    });
  }

  employeeColor = employeeColor;
}
