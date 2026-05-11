export interface SubjectScore {
  avg: number;
  count: number;
  total: number;
}

export interface WeeklyReport {
  id?: string;
  weekKey: string;
  weekStart: string;
  weekEnd: string;
  subjectScores: { [subject: string]: SubjectScore };
  tasksCompleted: number;
  tasksPending: number;
  carryOvers: number;
  overallAvg: number;
}
