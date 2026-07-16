import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Project } from '../../../../api/models/project';
import { User } from '../../../../api/models/user';
import {
  TimeEntryDetail,
  UpdateTimeEntryPayload,
} from '../../../../core/models/time-entry-detail.model';
import { ProjectsService } from '../../../../core/services/projects.service';
import { TimeEntriesService } from '../../../../core/services/time-entries.service';
import { UsersService } from '../../../../core/services/users.service';
import {
  calcOvertimeMinutes,
  DEFAULT_WEEKLY_HOURS,
  downloadTimeEntriesCsv,
  formatMinutes,
  formatOvertime,
  minutesToTimeInput,
  timeInputToMinutes,
} from '../../../../core/utils/time.util';
import { ButtonComponent } from '../../../../shared/components/button/button';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { InputComponent } from '../../../../shared/components/input/input';
import { ModalComponent } from '../../../../shared/components/modal/modal';

type Tab = 'projects' | 'employees';
type ExportPreset = 'week' | 'month' | 'custom';

interface ProjectGroup {
  projectId: string;
  projectName: string;
  totalMinutes: number;
  entries: TimeEntryDetail[];
}

interface EmployeeGroup {
  userId: string;
  userName: string;
  weeklyHours: number;
  totalMinutes: number;
  overtimeMinutes: number;
  entries: TimeEntryDetail[];
}

@Component({
  selector: 'app-time-tracking',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    ButtonComponent,
    InputComponent,
    ModalComponent,
    ConfirmDialogComponent,
  ],
  templateUrl: './time-tracking.html',
})
export class TimeTrackingPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly timeEntriesService = inject(TimeEntriesService);
  private readonly projectsService = inject(ProjectsService);
  private readonly usersService = inject(UsersService);

  readonly activeTab = signal<Tab>('projects');
  readonly isLoading = signal(true);
  readonly loadError = signal('');
  readonly entries = signal<TimeEntryDetail[]>([]);
  readonly projects = signal<Project[]>([]);
  readonly users = signal<User[]>([]);
  readonly expandedProjectId = signal<string | null>(null);
  readonly expandedUserId = signal<string | null>(null);

  readonly selectedYear = signal(new Date().getFullYear());
  readonly selectedMonth = signal(new Date().getMonth() + 1);

  readonly exportPreset = signal<ExportPreset>('month');
  readonly exportFrom = signal('');
  readonly exportTo = signal('');
  readonly isExporting = signal(false);
  readonly exportError = signal('');

  readonly editModalOpen = signal(false);
  readonly confirmSaveOpen = signal(false);
  readonly editingEntry = signal<TimeEntryDetail | null>(null);
  readonly isSaving = signal(false);
  readonly errorMessage = signal('');

  readonly months = [
    { value: 1, label: 'Januar' },
    { value: 2, label: 'Februar' },
    { value: 3, label: 'März' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mai' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Dezember' },
  ];
  readonly weekdayLabels = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  readonly form = this.fb.group({
    projectId: ['', Validators.required],
    date: ['', Validators.required],
    workTime: ['08:00', Validators.required],
    breakMinutes: [0, [Validators.required, Validators.min(0)]],
    comment: [''],
  });

  readonly totalMinutes = computed(() =>
    this.entries().reduce((sum, entry) => sum + entry.minutesWorked, 0),
  );

  readonly totalOvertimeMinutes = computed(() =>
    this.employeeGroups().reduce((sum, group) => sum + group.overtimeMinutes, 0),
  );

  readonly projectGroups = computed<ProjectGroup[]>(() => {
    const groups = new Map<string, ProjectGroup>();

    for (const project of this.projects()) {
      if (!project.id) continue;
      groups.set(project.id, {
        projectId: project.id,
        projectName: project.name ?? 'Unbenanntes Projekt',
        totalMinutes: 0,
        entries: [],
      });
    }

    for (const entry of this.entries()) {
      const key = entry.projectId || 'unknown';
      const group = groups.get(key) ?? {
        projectId: key,
        projectName: entry.projectName,
        totalMinutes: 0,
        entries: [],
      };
      group.totalMinutes += entry.minutesWorked;
      group.entries.push(entry);
      groups.set(key, group);
    }

    return [...groups.values()]
      .map((group) => ({
        ...group,
        entries: [...group.entries].sort((a, b) => b.date.localeCompare(a.date)),
      }))
      .sort((a, b) => a.projectName.localeCompare(b.projectName, 'de'));
  });

  readonly employeeGroups = computed<EmployeeGroup[]>(() => {
    const groups = new Map<string, EmployeeGroup>();

    for (const user of this.users()) {
      if (!user.id) continue;
      const name = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
      groups.set(user.id, {
        userId: user.id,
        userName: name || user.email || 'Unbekannt',
        weeklyHours: user.employmentContract?.weeklyHours ?? DEFAULT_WEEKLY_HOURS,
        totalMinutes: 0,
        overtimeMinutes: 0,
        entries: [],
      });
    }

    for (const entry of this.entries()) {
      const key = entry.userId || 'unknown';
      const group = groups.get(key) ?? {
        userId: key,
        userName: entry.userName,
        weeklyHours: DEFAULT_WEEKLY_HOURS,
        totalMinutes: 0,
        overtimeMinutes: 0,
        entries: [],
      };
      group.totalMinutes += entry.minutesWorked;
      group.entries.push(entry);
      groups.set(key, group);
    }

    return [...groups.values()]
      .map((group) => ({
        ...group,
        entries: [...group.entries].sort((a, b) => a.date.localeCompare(b.date)),
        overtimeMinutes: calcOvertimeMinutes(
          group.totalMinutes,
          group.weeklyHours,
          this.selectedYear(),
          this.selectedMonth(),
        ),
      }))
      .sort((a, b) => a.userName.localeCompare(b.userName, 'de'));
  });

  readonly calendarDays = computed<(number | null)[]>(() => {
    const year = this.selectedYear();
    const month = this.selectedMonth();
    const firstWeekday = new Date(year, month - 1, 1).getDay();
    const offset = firstWeekday === 0 ? 6 : firstWeekday - 1;
    const dayCount = new Date(year, month, 0).getDate();
    const cells: (number | null)[] = Array.from({ length: offset }, () => null);

    for (let day = 1; day <= dayCount; day++) cells.push(day);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  });

  ngOnInit(): void {
    this.setExportPreset('month');
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.loadError.set('');

    forkJoin({
      projects: this.projectsService.getAll(),
      users: this.usersService.getAll(),
      entries: this.timeEntriesService.getCompanyMonth(this.selectedYear(), this.selectedMonth()),
    }).subscribe({
      next: ({ projects, users, entries }) => {
        this.projects.set(projects);
        this.users.set(users);
        this.entries.set(entries);
        this.isLoading.set(false);
      },
      error: () => {
        this.loadError.set('Zeiteinträge konnten nicht geladen werden.');
        this.isLoading.set(false);
      },
    });
  }

  onPeriodChange(): void {
    this.expandedProjectId.set(null);
    this.expandedUserId.set(null);
    this.setExportPreset(this.exportPreset() === 'custom' ? 'month' : this.exportPreset());
    this.loadData();
  }

  setTab(tab: Tab): void {
    this.activeTab.set(tab);
  }

  toggleProject(id: string): void {
    this.expandedProjectId.set(this.expandedProjectId() === id ? null : id);
  }

  toggleEmployee(id: string): void {
    this.expandedUserId.set(this.expandedUserId() === id ? null : id);
    this.exportError.set('');
  }

  entriesForEmployeeDay(group: EmployeeGroup, day: number): TimeEntryDetail[] {
    const date = `${this.selectedYear()}-${String(this.selectedMonth()).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return group.entries.filter((entry) => entry.date.slice(0, 10) === date);
  }

  employeeDayMinutes(group: EmployeeGroup, day: number): number {
    return this.entriesForEmployeeDay(group, day).reduce(
      (sum, entry) => sum + entry.minutesWorked,
      0,
    );
  }

  setExportPreset(preset: ExportPreset): void {
    this.exportPreset.set(preset);
    this.exportError.set('');
    if (preset === 'custom') return;

    if (preset === 'month') {
      const year = this.selectedYear();
      const month = this.selectedMonth();
      this.exportFrom.set(this.localDate(new Date(year, month - 1, 1)));
      this.exportTo.set(this.localDate(new Date(year, month, 0)));
      return;
    }

    const now = new Date();
    const reference =
      now.getFullYear() === this.selectedYear() && now.getMonth() + 1 === this.selectedMonth()
        ? now
        : new Date(this.selectedYear(), this.selectedMonth() - 1, 1);
    const monday = new Date(reference);
    const weekday = monday.getDay() || 7;
    monday.setDate(monday.getDate() - weekday + 1);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    this.exportFrom.set(this.localDate(monday));
    this.exportTo.set(this.localDate(sunday));
  }

  setExportFrom(value: string): void {
    this.exportFrom.set(value);
    this.exportError.set('');
  }

  setExportTo(value: string): void {
    this.exportTo.set(value);
    this.exportError.set('');
  }

  exportEmployeeCsv(group: EmployeeGroup): void {
    const from = this.exportFrom();
    const to = this.exportTo();
    if (!from || !to || from > to) {
      this.exportError.set('Bitte einen gültigen Zeitraum auswählen.');
      return;
    }

    this.isExporting.set(true);
    this.exportError.set('');
    this.timeEntriesService.getRange(from, to, group.userId).subscribe({
      next: (entries) => {
        downloadTimeEntriesCsv(`mitarbeiter-${group.userName}-${from}-${to}.csv`, entries);
        this.isExporting.set(false);
      },
      error: () => {
        this.exportError.set('CSV-Export konnte nicht erstellt werden.');
        this.isExporting.set(false);
      },
    });
  }

  openEdit(entry: TimeEntryDetail): void {
    this.editingEntry.set(entry);
    this.form.patchValue({
      projectId: entry.projectId,
      date: entry.date.slice(0, 10),
      workTime: minutesToTimeInput(entry.minutesWorked),
      breakMinutes: entry.breakMinutes,
      comment: entry.comment ?? '',
    });
    this.errorMessage.set('');
    this.editModalOpen.set(true);
  }

  closeEditModal(): void {
    this.editModalOpen.set(false);
    this.editingEntry.set(null);
  }

  requestSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.confirmSaveOpen.set(true);
  }

  confirmSave(): void {
    const entry = this.editingEntry();
    if (!entry?.id) return;

    const raw = this.form.getRawValue();
    const payload: UpdateTimeEntryPayload = {
      projectId: raw.projectId!,
      date: raw.date!,
      minutesWorked: timeInputToMinutes(raw.workTime!),
      breakMinutes: Number(raw.breakMinutes),
      comment: raw.comment || null,
    };

    this.isSaving.set(true);
    this.errorMessage.set('');
    this.timeEntriesService.update(entry.id, payload).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.confirmSaveOpen.set(false);
        this.closeEditModal();
        this.loadData();
      },
      error: () => {
        this.isSaving.set(false);
        this.errorMessage.set('Zeiteintrag konnte nicht gespeichert werden.');
      },
    });
  }

  private localDate(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  formatMinutes = formatMinutes;
  formatOvertime = formatOvertime;
}
