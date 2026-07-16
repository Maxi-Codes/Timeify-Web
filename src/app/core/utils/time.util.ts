import { TimeEntryDetail } from '../models/time-entry-detail.model';

export const DEFAULT_WEEKLY_HOURS = 40;

export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} Min.`;
  if (m === 0) return `${h} Std.`;
  return `${h} Std. ${m} Min.`;
}

export function formatOvertime(minutes: number): string {
  const prefix = minutes >= 0 ? '+' : '−';
  return `${prefix}${formatMinutes(Math.abs(minutes))}`;
}

export function expectedMonthlyMinutes(
  weeklyHours: number,
  year: number,
  month: number,
): number {
  const daysInMonth = new Date(year, month, 0).getDate();
  const weeksInMonth = daysInMonth / 7;
  return Math.round(weeklyHours * 60 * weeksInMonth);
}

export function calcOvertimeMinutes(
  workedMinutes: number,
  weeklyHours: number,
  year: number,
  month: number,
): number {
  return workedMinutes - expectedMonthlyMinutes(weeklyHours, year, month);
}

export function minutesToTimeInput(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function timeInputToMinutes(value: string): number {
  const [h, m] = value.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function downloadTimeEntriesCsv(
  filename: string,
  entries: TimeEntryDetail[],
): void {
  const headers = [
    'Datum',
    'Mitarbeiter',
    'Projekt',
    'Arbeitszeit (Min)',
    'Pause (Min)',
    'Kommentar',
  ];
  const rows = entries.map((e) => [
    e.date.slice(0, 10),
    e.userName,
    e.projectName,
    e.minutesWorked,
    e.breakMinutes,
    e.comment ?? '',
  ]);

  const csv = [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';'),
    )
    .join('\n');

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
