export type TaskType = 'exam' | 'sales' | 'coding';
export type TaskStatus = 'pending' | 'submitted' | 'reviewed' | 'carry-over';
export type ExamType = 'open-book' | 'closed-book' | 'cumulative' | 'mock';

export interface Task {
  id?: string;
  type: TaskType;
  title: string;
  description: string;
  subject?: string;
  chapters?: string;
  examType?: ExamType;
  status: TaskStatus;
  proofUrls: string[];
  marks: number | null;
  feedback: string;
  isCarryOver: boolean;
  carryOverFromDate: string | null;
}

export interface DaySummary {
  avgScore: number;
  totalTasks: number;
  completedTasks: number;
  hasCarryOvers: boolean;
}

export interface DaySchedule {
  tasks: { [taskId: string]: Task };
  daySummary: DaySummary;
}
