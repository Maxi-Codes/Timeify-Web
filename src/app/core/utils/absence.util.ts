import { Absence } from '../../api/models/absence';
import { AbsenceStatus } from '../../api/models/absence-status';
import { User } from '../../api/models/user';

export const ABSENCE_STATUS_LABELS: Record<AbsenceStatus, string> = {
  0: 'Ausstehend',
  1: 'Genehmigt',
  2: 'Abgelehnt',
  3: 'Storniert',
};

export const ABSENCE_TYPE_LABELS: Record<number, string> = {
  0: 'Urlaub',
  1: 'Krankmeldung',
  2: 'Unbezahlt',
  3: 'Sonderurlaub',
};

export const EMPLOYEE_COLORS = [
  '#0B1F3A',
  '#F59E0B',
  '#059669',
  '#7C3AED',
  '#DC2626',
  '#0891B2',
  '#DB2777',
  '#65A30D',
];

export function employeeColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return EMPLOYEE_COLORS[Math.abs(hash) % EMPLOYEE_COLORS.length];
}

export function userDisplayName(user?: User | null): string {
  if (!user) return 'Unbekannt';
  return `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email || 'Unbekannt';
}

export function absenceUserName(absence: Absence, users: User[]): string {
  if (absence.user) return userDisplayName(absence.user);
  const user = users.find((u) => u.id === absence.userId);
  return userDisplayName(user);
}

export function isVacation(absence: Absence): boolean {
  return absence.type === 0;
}

export function isSickLeave(absence: Absence): boolean {
  return absence.type === 1;
}

export function isApprovedVacation(absence: Absence): boolean {
  return isVacation(absence) && absence.status === 1;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function dateInRange(date: Date, start: string, end: string): boolean {
  const d = date.toISOString().slice(0, 10);
  return d >= start.slice(0, 10) && d <= end.slice(0, 10);
}

export function calendarWeekdayLabels(): string[] {
  return ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
}

export function calendarCells(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month - 1, 1);
  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;
  const totalDays = daysInMonth(year, month);
  const cells: (number | null)[] = Array.from({ length: startOffset }, () => null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}
