export type DeadlineType = 'tma' | 'exam' | 'practical' | 'phase' | 'custom';

export interface Deadline {
  id?: string;
  title: string;
  date: string;
  type: DeadlineType;
  description: string;
  completed: boolean;
}
