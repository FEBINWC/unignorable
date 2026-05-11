export type TaskType = 'exam' | 'sales' | 'coding';
export type TaskStatus = 'pending' | 'submitted' | 'reviewed';
export type ExamType = 'open-book' | 'closed-book' | 'cumulative' | 'mock';
export type DayType = 'full' | 'light' | 'cumulative';

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
}

export interface DaySummary {
  avgScore: number;
  totalTasks: number;
  completedTasks: number;
}

export interface DayOrder {
  dayOrder: number;
  dayType: DayType;
  phase: number;
  tasks: { [taskId: string]: Task };
}

export interface Completion {
  dayOrder: number;
  completedDate: string;
  tasks: { [taskId: string]: Task };
  daySummary: DaySummary;
}

export interface Progress {
  currentDayOrder: number;
  targetEndDate: string;
  startDate: string;
  totalDayOrders: number;
}

export interface Vacation {
  id?: string;
  start: string;
  end: string;
  reason: string;
}

export type PaceStatus = 'on-track' | 'slightly-behind' | 'behind' | 'critical' | 'ahead';

export interface PaceInfo {
  currentDayOrder: number;
  totalDayOrders: number;
  dayOrdersCompleted: number;
  dayOrdersRemaining: number;
  workingDaysPassed: number;
  workingDaysRemaining: number;
  behindBy: number;
  requiredPace: number;
  status: PaceStatus;
  suggestion: string;
}
