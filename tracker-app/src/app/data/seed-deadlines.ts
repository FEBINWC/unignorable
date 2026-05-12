import { Deadline } from '../core/models/deadline.model';

export const SEED_DEADLINES: Omit<Deadline, 'id'>[] = [
  {
    title: 'Phase 1 Complete — All Chapters Covered',
    date: '2026-08-16',
    type: 'phase',
    description: 'All 180 chapters across 6 subjects should be covered (open-book) by this date.',
    completed: false,
  },
  {
    title: 'Phase 2 Complete — Closed-Book Reinforcement',
    date: '2026-11-22',
    type: 'phase',
    description: 'Closed-book reinforcement phase done. Should be scoring 50%+ consistently.',
    completed: false,
  },
  {
    title: 'Start TMA Preparation',
    date: '2026-12-01',
    type: 'tma',
    description: 'Begin preparing Tutor Marked Assignments for all 6 subjects.',
    completed: false,
  },
  {
    title: 'TMA Submission Deadline',
    date: '2027-01-31',
    type: 'tma',
    description: 'HARD DEADLINE. Submit all 6 TMAs online through NIOS portal. TMAs carry 20% weightage.',
    completed: false,
  },
  {
    title: 'CS Practical Sessions at Study Centre',
    date: '2027-02-01',
    type: 'practical',
    description: '5 compulsory PCP practical sessions at assigned study centre. Must attend all 5. CS practical = 40 marks.',
    completed: false,
  },
  {
    title: 'Final Sprint Begins',
    date: '2027-02-01',
    type: 'phase',
    description: 'Phase 4: Two papers/day, reduced coding/sales. Previous year papers only. Peak preparation.',
    completed: false,
  },
  {
    title: 'Public Examination Begins',
    date: '2027-03-15',
    type: 'exam',
    description: 'NIOS March-April 2027 Senior Secondary Public Examination begins. Check datesheet on nios.ac.in.',
    completed: false,
  },
  {
    title: 'Exam Registration Deadline (Approx)',
    date: '2027-01-10',
    type: 'exam',
    description: 'Register for March-April 2027 exam. Pay exam fee: Rs. 300/subject + Rs. 150 for CS practical.',
    completed: false,
  },
];
