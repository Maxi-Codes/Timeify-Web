export interface TimeEntryDetail {
  id: string;
  userId: string;
  userName: string;
  projectId: string;
  projectName: string;
  date: string;
  minutesWorked: number;
  breakMinutes: number;
  comment?: string | null;
}

export interface UpdateTimeEntryPayload {
  projectId: string;
  date: string;
  minutesWorked: number;
  breakMinutes: number;
  comment?: string | null;
}
