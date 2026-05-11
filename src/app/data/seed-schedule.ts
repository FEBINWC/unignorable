import { DaySchedule, ExamType, Task } from '../core/models/task.model';
import {
  ALL_CHAPTERS,
  SUBJECTS,
} from './subjects';
import { SALES_ACTIVITIES } from './sales-activities';
import { CODING_MILESTONES } from './coding-milestones';

const START_DATE = '2026-06-01'; // Monday

// Weekly exam schedule for Phase 1:
// Mon: Accountancy (3 ch)
// Tue: Economics (3 ch) + English (3 ch)
// Wed: Computer Science (3 ch)
// Thu: Accountancy (3 ch)
// Fri: Psychology (3 ch) + Business Studies (3 ch)
// Sat: Cumulative test (rotating)
// Sun: Light day

interface SubjectProgress {
  [subject: string]: number; // index of next chapter to assign
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function getDayOfWeek(dateStr: string): number {
  const d = new Date(dateStr + 'T00:00:00');
  return d.getDay(); // 0=Sun, 1=Mon, ...
}

function getMonthFromStart(dateStr: string): number {
  const start = new Date(START_DATE);
  const current = new Date(dateStr);
  return (
    (current.getFullYear() - start.getFullYear()) * 12 +
    current.getMonth() -
    start.getMonth() +
    1
  );
}

function getChapterRange(
  subject: string,
  progress: SubjectProgress,
  count: number
): { chapters: string; chapterNames: string[] } {
  const allCh = ALL_CHAPTERS[subject];
  const start = progress[subject] || 0;
  const end = Math.min(start + count, allCh.length);
  const names = allCh.slice(start, end);
  progress[subject] = end;
  return {
    chapters: names.length > 0 ? `${names[0].split(':')[0]} - ${names[names.length - 1].split(':')[0]}` : '',
    chapterNames: names,
  };
}

function createExamTask(
  subject: string,
  chapters: string,
  examType: ExamType,
  description: string
): Task {
  return {
    type: 'exam',
    title: `${subject} Exam`,
    description,
    subject,
    chapters,
    examType,
    status: 'pending',
    proofUrls: [],
    marks: null,
    feedback: '',
    isCarryOver: false,
    carryOverFromDate: null,
  };
}

function createSalesTask(dayOfWeek: number): Task {
  const activity = SALES_ACTIVITIES[dayOfWeek] || SALES_ACTIVITIES[6];
  return {
    type: 'sales',
    title: activity.title,
    description: activity.description,
    status: 'pending',
    proofUrls: [],
    marks: null,
    feedback: '',
    isCarryOver: false,
    carryOverFromDate: null,
  };
}

function createCodingTask(month: number): Task {
  const milestone = CODING_MILESTONES[Math.min(month, 10)] || CODING_MILESTONES[10];
  return {
    type: 'coding',
    title: `patternsOfLife: ${milestone.title}`,
    description: milestone.description,
    status: 'pending',
    proofUrls: [],
    marks: null,
    feedback: '',
    isCarryOver: false,
    carryOverFromDate: null,
  };
}

function buildDaySummary(tasks: Task[]) {
  return {
    avgScore: 0,
    totalTasks: tasks.length,
    completedTasks: 0,
    hasCarryOvers: false,
  };
}

export function generateFullSchedule(): { [date: string]: DaySchedule } {
  const schedule: { [date: string]: DaySchedule } = {};
  const progress: SubjectProgress = {
    [SUBJECTS.ACCOUNTANCY]: 0,
    [SUBJECTS.ECONOMICS]: 0,
    [SUBJECTS.COMPUTER_SCIENCE]: 0,
    [SUBJECTS.ENGLISH]: 0,
    [SUBJECTS.PSYCHOLOGY]: 0,
    [SUBJECTS.BUSINESS_STUDIES]: 0,
  };

  const cumulativeTestRotation = [
    SUBJECTS.ACCOUNTANCY,
    SUBJECTS.ECONOMICS,
    SUBJECTS.COMPUTER_SCIENCE,
    SUBJECTS.PSYCHOLOGY,
    SUBJECTS.BUSINESS_STUDIES,
    SUBJECTS.ENGLISH,
  ];

  // PHASE 1: Weeks 1-11 (Open-book, sequential chapter coverage)
  for (let week = 0; week < 11; week++) {
    for (let day = 0; day < 7; day++) {
      const dateStr = addDays(START_DATE, week * 7 + day);
      const dow = getDayOfWeek(dateStr);
      const month = getMonthFromStart(dateStr);
      const tasks: Task[] = [];
      let taskMap: { [id: string]: Task } = {};

      if (dow === 0) {
        // Sunday - light day
        tasks.push({
          type: 'exam',
          title: 'Review Week\'s Errors',
          description: 'Go through all wrong answers from the week. Note patterns and weak areas.',
          examType: 'open-book',
          status: 'pending',
          proofUrls: [],
          marks: null,
          feedback: '',
          isCarryOver: false,
          carryOverFromDate: null,
        });
        tasks.push(createSalesTask(dow));
      } else if (dow === 6) {
        // Saturday - cumulative closed-book test
        const subject = cumulativeTestRotation[week % cumulativeTestRotation.length];
        const coveredCount = progress[subject] || 0;
        const allCh = ALL_CHAPTERS[subject];
        const coveredChapters = allCh.slice(0, coveredCount);
        const chapRange = coveredCount > 0
          ? `${allCh[0].split(':')[0]} - ${allCh[Math.min(coveredCount - 1, allCh.length - 1)].split(':')[0]}`
          : 'All covered chapters';

        tasks.push(
          createExamTask(
            subject,
            chapRange,
            'cumulative',
            `CLOSED BOOK cumulative test. Covers all ${coveredCount} chapters studied so far.`
          )
        );
        tasks.push(createSalesTask(dow));
        tasks.push(createCodingTask(month));
      } else if (dow === 1) {
        // Monday - Accountancy (3 chapters)
        const { chapters } = getChapterRange(SUBJECTS.ACCOUNTANCY, progress, 3);
        if (chapters) {
          tasks.push(
            createExamTask(SUBJECTS.ACCOUNTANCY, chapters, 'open-book',
              'Study these chapters and write the exam paper. Open book allowed.')
          );
        }
        tasks.push(createSalesTask(dow));
        tasks.push(createCodingTask(month));
      } else if (dow === 2) {
        // Tuesday - Economics (3) + English (3)
        const eco = getChapterRange(SUBJECTS.ECONOMICS, progress, 3);
        const eng = getChapterRange(SUBJECTS.ENGLISH, progress, 3);
        if (eco.chapters) {
          tasks.push(
            createExamTask(SUBJECTS.ECONOMICS, eco.chapters, 'open-book',
              'Economics paper. Study and write. Open book allowed.')
          );
        }
        if (eng.chapters) {
          tasks.push(
            createExamTask(SUBJECTS.ENGLISH, eng.chapters, 'open-book',
              'English paper. Study and write. Open book allowed.')
          );
        }
        tasks.push(createSalesTask(dow));
        tasks.push(createCodingTask(month));
      } else if (dow === 3) {
        // Wednesday - Computer Science (3)
        const { chapters } = getChapterRange(SUBJECTS.COMPUTER_SCIENCE, progress, 3);
        if (chapters) {
          tasks.push(
            createExamTask(SUBJECTS.COMPUTER_SCIENCE, chapters, 'open-book',
              'CS paper. Study and write. Open book allowed. Evening: 1 hr C++ practice.')
          );
        }
        tasks.push(createSalesTask(dow));
        tasks.push(createCodingTask(month));
      } else if (dow === 4) {
        // Thursday - Accountancy (3)
        const { chapters } = getChapterRange(SUBJECTS.ACCOUNTANCY, progress, 3);
        if (chapters) {
          tasks.push(
            createExamTask(SUBJECTS.ACCOUNTANCY, chapters, 'open-book',
              'Accountancy paper. Study and write. Open book allowed.')
          );
        }
        tasks.push(createSalesTask(dow));
        tasks.push(createCodingTask(month));
      } else if (dow === 5) {
        // Friday - Psychology (3) + Business Studies (3)
        const psy = getChapterRange(SUBJECTS.PSYCHOLOGY, progress, 3);
        const bs = getChapterRange(SUBJECTS.BUSINESS_STUDIES, progress, 3);
        if (psy.chapters) {
          tasks.push(
            createExamTask(SUBJECTS.PSYCHOLOGY, psy.chapters, 'open-book',
              'Psychology paper. Study and write. Open book allowed.')
          );
        }
        if (bs.chapters) {
          tasks.push(
            createExamTask(SUBJECTS.BUSINESS_STUDIES, bs.chapters, 'open-book',
              'Business Studies paper. Study and write. Open book allowed.')
          );
        }
        tasks.push(createSalesTask(dow));
        tasks.push(createCodingTask(month));
      }

      if (tasks.length > 0) {
        tasks.forEach((t, i) => {
          taskMap[`task_${i}`] = t;
        });
        schedule[dateStr] = {
          tasks: taskMap,
          daySummary: buildDaySummary(tasks),
        };
      }
    }
  }

  // PHASE 2: Weeks 12-24 (Closed-book, mixed chapters)
  const phase2Subjects = [
    SUBJECTS.ACCOUNTANCY,
    SUBJECTS.ECONOMICS,
    SUBJECTS.COMPUTER_SCIENCE,
    SUBJECTS.ENGLISH,
    SUBJECTS.PSYCHOLOGY,
    SUBJECTS.BUSINESS_STUDIES,
  ];

  for (let week = 11; week < 24; week++) {
    for (let day = 0; day < 7; day++) {
      const dateStr = addDays(START_DATE, week * 7 + day);
      const dow = getDayOfWeek(dateStr);
      const month = getMonthFromStart(dateStr);
      const tasks: Task[] = [];
      let taskMap: { [id: string]: Task } = {};

      if (dow === 0) {
        // Sunday - light review
        tasks.push({
          type: 'exam',
          title: 'Review Week\'s Errors',
          description: 'Review wrong answers. Focus on patterns of mistakes.',
          examType: 'closed-book',
          status: 'pending',
          proofUrls: [],
          marks: null,
          feedback: '',
          isCarryOver: false,
          carryOverFromDate: null,
        });
        tasks.push(createSalesTask(dow));
      } else if (dow === 6) {
        // Saturday - full mock
        const subject = phase2Subjects[(week - 11) % phase2Subjects.length];
        tasks.push(
          createExamTask(subject, 'Full Syllabus', 'mock',
            `FULL MOCK EXAM. Closed book. 3 hours. Simulate real exam conditions.`)
        );
        tasks.push(createSalesTask(dow));
        tasks.push(createCodingTask(month));
      } else {
        // Weekdays - closed-book mixed chapter papers
        let subjects: string[] = [];
        if (dow === 1) subjects = [SUBJECTS.ACCOUNTANCY];
        else if (dow === 2) subjects = [SUBJECTS.ECONOMICS, SUBJECTS.ENGLISH];
        else if (dow === 3) subjects = [SUBJECTS.COMPUTER_SCIENCE];
        else if (dow === 4) subjects = [SUBJECTS.ACCOUNTANCY];
        else if (dow === 5) subjects = [SUBJECTS.PSYCHOLOGY, SUBJECTS.BUSINESS_STUDIES];

        for (const subject of subjects) {
          const allCh = ALL_CHAPTERS[subject];
          // Pick 3 random chapters for mixed review
          const indices: number[] = [];
          for (let i = 0; i < 3 && i < allCh.length; i++) {
            let idx;
            do {
              idx = Math.floor(((week * 7 + day + i) * 31) % allCh.length);
            } while (indices.includes(idx) && indices.length < allCh.length);
            indices.push(idx);
          }
          const chapters = indices.map((i) => allCh[i].split(':')[0]).join(', ');

          tasks.push(
            createExamTask(subject, chapters, 'closed-book',
              `CLOSED BOOK. Mixed chapters review paper. No reference material allowed.`)
          );
        }
        tasks.push(createSalesTask(dow));
        tasks.push(createCodingTask(month));
      }

      if (tasks.length > 0) {
        tasks.forEach((t, i) => {
          taskMap[`task_${i}`] = t;
        });
        schedule[dateStr] = {
          tasks: taskMap,
          daySummary: buildDaySummary(tasks),
        };
      }
    }
  }

  // PHASE 3: Weeks 25-32 (TMA + Previous Year Papers)
  for (let week = 24; week < 32; week++) {
    for (let day = 0; day < 7; day++) {
      const dateStr = addDays(START_DATE, week * 7 + day);
      const dow = getDayOfWeek(dateStr);
      const month = getMonthFromStart(dateStr);
      const tasks: Task[] = [];
      let taskMap: { [id: string]: Task } = {};

      if (dow === 0) {
        tasks.push(createSalesTask(dow));
      } else if (week < 26) {
        // Weeks 25-26: TMA preparation
        const tmaSubjects: { [key: number]: string[] } = {
          1: [SUBJECTS.ACCOUNTANCY, SUBJECTS.ECONOMICS],
          2: [SUBJECTS.ACCOUNTANCY, SUBJECTS.ECONOMICS],
          3: [SUBJECTS.COMPUTER_SCIENCE, SUBJECTS.PSYCHOLOGY],
          4: [SUBJECTS.COMPUTER_SCIENCE, SUBJECTS.PSYCHOLOGY],
          5: [SUBJECTS.ENGLISH, SUBJECTS.BUSINESS_STUDIES],
          6: [SUBJECTS.ENGLISH, SUBJECTS.BUSINESS_STUDIES],
        };
        const subjects = tmaSubjects[dow] || [];
        for (const subject of subjects) {
          tasks.push({
            type: 'exam',
            title: `TMA: ${subject}`,
            description: `Complete and upload TMA (Tutor Marked Assignment) for ${subject}. Deadline: 31 Jan 2027.`,
            subject,
            chapters: 'TMA',
            examType: 'open-book',
            status: 'pending',
            proofUrls: [],
            marks: null,
            feedback: '',
            isCarryOver: false,
            carryOverFromDate: null,
          });
        }
        tasks.push(createSalesTask(dow));
        tasks.push(createCodingTask(month));
      } else {
        // Weeks 27-32: Previous year papers
        let subjects: string[] = [];
        if (dow === 1) subjects = [SUBJECTS.ACCOUNTANCY];
        else if (dow === 2) subjects = [SUBJECTS.ECONOMICS, SUBJECTS.ENGLISH];
        else if (dow === 3) subjects = [SUBJECTS.COMPUTER_SCIENCE];
        else if (dow === 4) subjects = [SUBJECTS.ACCOUNTANCY];
        else if (dow === 5) subjects = [SUBJECTS.PSYCHOLOGY, SUBJECTS.BUSINESS_STUDIES];
        else if (dow === 6) {
          const sub = phase2Subjects[(week - 26) % phase2Subjects.length];
          subjects = [sub];
        }

        for (const subject of subjects) {
          tasks.push(
            createExamTask(subject, 'Full Syllabus', 'mock',
              `Previous year paper. CLOSED BOOK. Strict 3-hour timing. Simulate real exam.`)
          );
        }
        tasks.push(createSalesTask(dow));
        tasks.push(createCodingTask(month));
      }

      if (tasks.length > 0) {
        tasks.forEach((t, i) => {
          taskMap[`task_${i}`] = t;
        });
        schedule[dateStr] = {
          tasks: taskMap,
          daySummary: buildDaySummary(tasks),
        };
      }
    }
  }

  // PHASE 4: Weeks 33-40 (Sprint - 2 papers/day, reduced sales/coding)
  for (let week = 32; week < 40; week++) {
    for (let day = 0; day < 7; day++) {
      const dateStr = addDays(START_DATE, week * 7 + day);
      const dow = getDayOfWeek(dateStr);
      const month = getMonthFromStart(dateStr);
      const tasks: Task[] = [];
      let taskMap: { [id: string]: Task } = {};

      if (dow === 0) {
        tasks.push({
          type: 'exam',
          title: 'Weak Chapter Revision',
          description: 'Revise chapters where scores were lowest in mocks.',
          status: 'pending',
          proofUrls: [],
          marks: null,
          feedback: '',
          isCarryOver: false,
          carryOverFromDate: null,
        });
        tasks.push(createSalesTask(dow));
      } else {
        // Two papers per day — hard + easy
        const hardSubjects = [SUBJECTS.ACCOUNTANCY, SUBJECTS.ECONOMICS, SUBJECTS.COMPUTER_SCIENCE];
        const easySubjects = [SUBJECTS.ENGLISH, SUBJECTS.PSYCHOLOGY, SUBJECTS.BUSINESS_STUDIES];
        const dayIndex = (week - 32) * 6 + (dow <= 5 ? dow - 1 : 5);

        const hardSub = hardSubjects[dayIndex % hardSubjects.length];
        const easySub = easySubjects[dayIndex % easySubjects.length];

        tasks.push(
          createExamTask(hardSub, 'Full Syllabus', 'mock',
            `Morning paper. CLOSED BOOK. Previous year or mock. Strict timing.`)
        );
        tasks.push(
          createExamTask(easySub, 'Full Syllabus', 'mock',
            `Afternoon paper. CLOSED BOOK. Revision focus.`)
        );
        tasks.push(createSalesTask(dow));
        tasks.push(createCodingTask(month));
      }

      if (tasks.length > 0) {
        tasks.forEach((t, i) => {
          taskMap[`task_${i}`] = t;
        });
        schedule[dateStr] = {
          tasks: taskMap,
          daySummary: buildDaySummary(tasks),
        };
      }
    }
  }

  return schedule;
}
