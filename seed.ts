import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, update } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyCkiQK6u6v-5Hr3WNCulUVif_1h3a3X0yY',
  authDomain: 'unignorable.firebaseapp.com',
  databaseURL: 'https://unignorable-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'unignorable',
  storageBucket: 'unignorable.firebasestorage.app',
  messagingSenderId: '1083458925635',
  appId: '1:1083458925635:web:3c2411df0f46d2f6c990f6',
};

// ---- Inline seed data (avoiding TS module resolution issues) ----

type TaskType = 'exam' | 'sales' | 'coding';
type TaskStatus = 'pending' | 'submitted' | 'reviewed' | 'carry-over';
type ExamType = 'open-book' | 'closed-book' | 'cumulative' | 'mock';

interface Task {
  type: TaskType;
  title: string;
  description: string;
  subject?: string | null;
  chapters?: string | null;
  examType?: ExamType | null;
  status: TaskStatus;
  proofUrls: string[];
  marks: number | null;
  feedback: string;
  isCarryOver: boolean;
  carryOverFromDate: string | null;
}

interface DaySummary {
  avgScore: number;
  totalTasks: number;
  completedTasks: number;
  hasCarryOvers: boolean;
}

interface DaySchedule {
  tasks: { [taskId: string]: Task };
  daySummary: DaySummary;
}

const ALL_CHAPTERS: { [subject: string]: string[] } = {
  Accountancy: [
    'Ch 1: Accounting - An Introduction','Ch 2: Accounting Concepts','Ch 3: Accounting Conventions and Standards',
    'Ch 4: Accounting for Business Transactions','Ch 5: Journal','Ch 6: Ledger','Ch 7: Cash Book',
    'Ch 8: Special Purpose Books','Ch 9: Trial Balance','Ch 10: Bank Reconciliation Statement',
    'Ch 11: Bills of Exchange','Ch 12: Errors and their Rectification','Ch 13: Computer and Computerised Accounting System',
    'Ch 14: Depreciation','Ch 15: Provision and Reserves','Ch 16: Financial Statements - An Introduction',
    'Ch 17: Financial Statements - I','Ch 18: Financial Statements II',
    'Ch 19: Not for Profit Organisations - An Introduction','Ch 20: Financial Statements (Not for Profit Organisations)',
    'Ch 21: Accounts From Incomplete Records','Ch 22: Partnership - An Introduction','Ch 23: Admission of a Partner',
    'Ch 24: Retirement and Death of a Partner','Ch 25: Dissolution of a Partnership Firm',
    'Ch 26: Company - An Introduction','Ch 27: Issue of Shares','Ch 28: Forfeiture of Shares',
    'Ch 29: Reissue of Forfeited Shares','Ch 30: Issue of Debentures',
    'Ch 31: Financial Statements Analysis - An Introduction','Ch 32: Accounting Ratios - I',
    'Ch 33: Accounting Ratios - II','Ch 34: Cash Flow Statement','Ch 35: Electronic Spread Sheet',
    'Ch 36: Use of Spreadsheet in Business Application','Ch 37: Graphs and Charts for Business',
    'Ch 38: Database Management System for Accounting',
  ],
  Economics: [
    'Ch 1: Overview of Indian Economy','Ch 2: Economic Planning in India','Ch 3: Economic Growth and Economic Development',
    'Ch 4: The Problem of Unemployment, Poverty and Inequality','Ch 5: Meaning, Scope and its Need in Economics',
    'Ch 6: Collection and Classification of Data','Ch 7: Presentation of Data','Ch 8: Measures of Central Tendency',
    'Ch 9: Measures of Dispersion','Ch 10: Correlation Analysis','Ch 11: Index Numbers',
    'Ch 12: Introduction to the Study of Economics','Ch 13: Central Problems of an Economy',
    'Ch 14: Consumer Equilibrium','Ch 15: Demand','Ch 16: Price Elasticity of Demand',
    'Ch 17: Production Function','Ch 18: Cost of Production','Ch 19: Supply',
    'Ch 20: Price Elasticity of Supply','Ch 21: Forms of Market',
    'Ch 22: Price Determination Under Perfect Competition','Ch 23: Revenue and Profit Maximization',
    'Ch 24: National Income and Related Aggregates','Ch 25: National Income and its Measurement',
    'Ch 26: Consumption, Saving and Investment','Ch 27: Theory of Income Determination',
    'Ch 28: Money and Banking','Ch 29: Government and the Budget',
  ],
  'Computer Science': [
    'Ch 1: Computer Fundamentals','Ch 2: Binary Logic','Ch 3: Computer Software','Ch 4: Operating Systems',
    'Ch 5: Data Communication and Networking','Ch 6: Communications on Internet','Ch 7: Emailing',
    'Ch 8: Digital Documentation','Ch 9: Spreadsheets','Ch 10: Digital Presentation',
    'Ch 11: Open Source Resources','Ch 12: Introduction to C++','Ch 13: Basic Concepts of OOP',
    'Ch 14: Control Statements','Ch 15: Functions','Ch 16: Array',
    'Ch 17: Structure, Typedef & Enumerated Data Type','Ch 18: Classes and Objects',
    'Ch 19: Inheritance','Ch 20: Pointer','Ch 21: Files',
    'Ch 22: Data Structure & Web Designing','Ch 23: Database Management Systems',
    'Ch 24: Web Designing using HTML','Ch 25: Images and Lists in a Web Page',
    'Ch 26: New Trends in Computing','Ch 27: Project Management Skills',
    'Ch 28: Entrepreneurship Skills','Ch 29: Professional Communication Skills',
  ],
  English: [
    'Ch 1: My First Steps','Ch 2: Leisure','Ch 3: Reading With Understanding',
    'Ch 4: Father Dear Father','Ch 5: Fuel of the Future','Ch 6: My Grandmothers House',
    'Ch 7: Reading With Understanding','Ch 8: A Case of Suspicion','Ch 9: My Son Will Not a Beggar Be',
    'Ch 10: Where the Mind is Without Fear','Ch 11: Reading With Understanding','Ch 12: If I Were You',
    'Ch 13: The Tiger in the Tunnel','Ch 14: The Road Not Taken','Ch 15: Reading With Understanding',
    'Ch 16: I Must Know the Truth','Ch 17: India - Her Past and Future','Ch 18: Night of the Scorpion',
    'Ch 19: Reading','Ch 20: Reading','Ch 21: Reading','Ch 22: Reading','Ch 23: Reading','Ch 24: Reading',
    'Ch 25: Bholi','Ch 26A: ESP Receptionist','Ch 27A: ESP Office Communication',
    'Ch 28A: ESP Business Correspondence','Ch 29A: ESP Report Writing',
    'Ch 30A: ESP Presentation Skills','Ch 31B: ESP Professional Communication',
  ],
  Psychology: [
    'Ch 1: Understanding Self and Others','Ch 2: How Psychologists Study',
    'Ch 3: Biological and Cultural Shaping','Ch 4: Becoming Aware of the World',
    'Ch 5: Attention and Perception','Ch 6: Learning Process','Ch 7: Remembering and Forgetting',
    'Ch 8: Thinking and Reasoning','Ch 9: Motivation','Ch 10: Emotion',
    'Ch 11: Development Its Nature','Ch 12: Domains of Development','Ch 13: Adolescence',
    'Ch 14: Adulthood and Ageing','Ch 15: Intelligence','Ch 16: What is Self',
    'Ch 17: Self and Psychological Processes','Ch 18: Personality Theories',
    'Ch 19: Personality Assessment','Ch 20: Psychological Disorders','Ch 21: Group Processes',
    'Ch 22: Person Perception','Ch 23: Human-Environment Interaction','Ch 24: Psychotherapy',
    'Ch 25: Health Psychology','Ch 26A: Education and Work','Ch 27A: Career Development',
    'Ch 28A: Vocational Choice','Ch 29A: Stress and Your Health','Ch 30A: Stress Management',
  ],
  'Business Studies': [
    'Ch 1: Nature and Scope of Business','Ch 2: Business Support Services','Ch 3: Business Environment',
    'Ch 4: Forms of Business Organisations','Ch 5: Company Form','Ch 6: Fundamentals of Management',
    'Ch 7: Planning and Organising','Ch 8: Staffing and Directing','Ch 9: Co-ordination and Controlling',
    'Ch 10: Financial Planning','Ch 11: Short Term Sources of Finance','Ch 12: Long-term Sources',
    'Ch 13: The Financial Market','Ch 14: Introduction to Marketing','Ch 15: The Marketing Mix',
    'Ch 16: Advertising and Salesmanship','Ch 17: Consumer Protection','Ch 18: Internal Trade',
    'Ch 19: External Trade','Ch 20: Self-Employment','Ch 21: Job Employment',
    'Ch 22: Skill Development','Ch 23: Modern Modes of Business',
  ],
};

const SALES_ACTIVITIES: { [dow: number]: { title: string; description: string } } = {
  0: { title: 'Sales Book Reading', description: 'Read 1 chapter. Write 3 takeaways for patternsOfLife.' },
  1: { title: 'Cold Calling Practice', description: 'Practice cold call scripts. Mock or real outreach.' },
  2: { title: 'SaaS Demo Analysis', description: 'Watch 1 SaaS demo. Write breakdown: hook, pain, solution, CTA.' },
  3: { title: 'Content Creation', description: 'Write 1 LinkedIn post or script a video about patternsOfLife.' },
  4: { title: 'Role-Play & Objection Handling', description: 'Practice selling patternsOfLife. Record if possible.' },
  5: { title: 'Product Knowledge', description: 'Study patternsOfLife features, competitors, pricing.' },
  6: { title: 'Light Sales Reading', description: 'Read sales book chapter or listen to podcast. No pressure.' },
};

const CODING_MILESTONES: { [m: number]: { title: string; description: string } } = {
  1: { title: 'Project Setup & Onboarding UI', description: 'Set up patternsOfLife. Build onboarding screens.' },
  2: { title: 'Journal Feature', description: 'Text entry, save, view history.' },
  3: { title: 'Habit Tracker', description: 'Create habits, mark daily, streaks.' },
  4: { title: 'AI Coach Integration', description: 'Prompt engineering, API calls.' },
  5: { title: 'Self-Awareness Module', description: 'Mood tracking, pattern recognition.' },
  6: { title: 'Identity Gap Feature', description: 'Ideal self vs reality tracker.' },
  7: { title: 'Push Notifications', description: 'Daily reminders and alerts.' },
  8: { title: 'Polish & Beta Testing', description: 'Bug fixes, UI polish.' },
  9: { title: 'Launch Prep', description: 'App store listing, deployment.' },
  10: { title: 'Iterate on Feedback', description: 'Changes based on user feedback.' },
};

const SEED_DEADLINES = [
  { title: 'Phase 1 Complete', date: '2026-08-16', type: 'phase', description: 'All 180 chapters covered (open-book).', completed: false },
  { title: 'Phase 2 Complete', date: '2026-11-22', type: 'phase', description: 'Closed-book reinforcement done.', completed: false },
  { title: 'Start TMA Preparation', date: '2026-12-01', type: 'tma', description: 'Begin TMAs for all 6 subjects.', completed: false },
  { title: 'TMA Submission Deadline', date: '2027-01-31', type: 'tma', description: 'HARD DEADLINE. Submit all 6 TMAs online. 20% weightage.', completed: false },
  { title: 'CS Practical Sessions', date: '2027-02-01', type: 'practical', description: '5 compulsory PCP sessions. CS practical = 40 marks.', completed: false },
  { title: 'Final Sprint Begins', date: '2027-02-01', type: 'phase', description: 'Two papers/day, reduced coding/sales.', completed: false },
  { title: 'Public Examination', date: '2027-03-15', type: 'exam', description: 'NIOS March-April 2027 exam begins.', completed: false },
  { title: 'Exam Registration Deadline', date: '2027-01-10', type: 'exam', description: 'Register + pay exam fee.', completed: false },
];

const START_DATE = '2026-06-01';
const SUBJECTS = { ACC: 'Accountancy', ECO: 'Economics', CS: 'Computer Science', ENG: 'English', PSY: 'Psychology', BS: 'Business Studies' };

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function getDow(dateStr: string): number {
  return new Date(dateStr + 'T00:00:00').getDay();
}

function getMonth(dateStr: string): number {
  const s = new Date(START_DATE), c = new Date(dateStr);
  return (c.getFullYear() - s.getFullYear()) * 12 + c.getMonth() - s.getMonth() + 1;
}

function mkExam(subject: string, chapters: string, examType: ExamType, desc: string): Task {
  return { type: 'exam', title: `${subject} Exam`, description: desc, subject, chapters, examType, status: 'pending', proofUrls: [], marks: null, feedback: '', isCarryOver: false, carryOverFromDate: null };
}

function mkSales(dow: number): Task {
  const a = SALES_ACTIVITIES[dow] || SALES_ACTIVITIES[6];
  return { type: 'sales', title: a.title, description: a.description, status: 'pending', proofUrls: [], marks: null, feedback: '', isCarryOver: false, carryOverFromDate: null };
}

function mkCoding(month: number): Task {
  const m = CODING_MILESTONES[Math.min(month, 10)] || CODING_MILESTONES[10];
  return { type: 'coding', title: `patternsOfLife: ${m.title}`, description: m.description, status: 'pending', proofUrls: [], marks: null, feedback: '', isCarryOver: false, carryOverFromDate: null };
}

function mkSummary(tasks: Task[]): DaySummary {
  return { avgScore: 0, totalTasks: tasks.length, completedTasks: 0, hasCarryOvers: false };
}

function generateSchedule(): { [date: string]: DaySchedule } {
  const schedule: { [date: string]: DaySchedule } = {};
  const progress: { [s: string]: number } = { [SUBJECTS.ACC]: 0, [SUBJECTS.ECO]: 0, [SUBJECTS.CS]: 0, [SUBJECTS.ENG]: 0, [SUBJECTS.PSY]: 0, [SUBJECTS.BS]: 0 };
  const cumRotation = [SUBJECTS.ACC, SUBJECTS.ECO, SUBJECTS.CS, SUBJECTS.PSY, SUBJECTS.BS, SUBJECTS.ENG];

  function getChapters(subject: string, count: number): string {
    const all = ALL_CHAPTERS[subject];
    const start = progress[subject] || 0;
    const end = Math.min(start + count, all.length);
    const names = all.slice(start, end);
    progress[subject] = end;
    return names.length > 0 ? `${names[0].split(':')[0]} - ${names[names.length - 1].split(':')[0]}` : '';
  }

  function addDay(dateStr: string, tasks: Task[]) {
    if (tasks.length === 0) return;
    const taskMap: { [id: string]: Task } = {};
    tasks.forEach((t, i) => { taskMap[`task_${i}`] = t; });
    schedule[dateStr] = { tasks: taskMap, daySummary: mkSummary(tasks) };
  }

  // PHASE 1: Weeks 1-11
  for (let week = 0; week < 11; week++) {
    for (let day = 0; day < 7; day++) {
      const dateStr = addDays(START_DATE, week * 7 + day);
      const dow = getDow(dateStr);
      const month = getMonth(dateStr);
      const tasks: Task[] = [];

      if (dow === 0) {
        tasks.push({ type: 'exam', title: "Review Week's Errors", description: 'Go through wrong answers.', examType: 'open-book', status: 'pending', proofUrls: [], marks: null, feedback: '', isCarryOver: false, carryOverFromDate: null });
        tasks.push(mkSales(dow));
      } else if (dow === 6) {
        const sub = cumRotation[week % cumRotation.length];
        const count = progress[sub] || 0;
        tasks.push(mkExam(sub, `All ${count} chapters covered`, 'cumulative', 'CLOSED BOOK cumulative test.'));
        tasks.push(mkSales(dow));
        tasks.push(mkCoding(month));
      } else if (dow === 1) {
        const ch = getChapters(SUBJECTS.ACC, 3);
        if (ch) tasks.push(mkExam(SUBJECTS.ACC, ch, 'open-book', 'Study and write. Open book.'));
        tasks.push(mkSales(dow)); tasks.push(mkCoding(month));
      } else if (dow === 2) {
        const eco = getChapters(SUBJECTS.ECO, 3), eng = getChapters(SUBJECTS.ENG, 3);
        if (eco) tasks.push(mkExam(SUBJECTS.ECO, eco, 'open-book', 'Economics paper. Open book.'));
        if (eng) tasks.push(mkExam(SUBJECTS.ENG, eng, 'open-book', 'English paper. Open book.'));
        tasks.push(mkSales(dow)); tasks.push(mkCoding(month));
      } else if (dow === 3) {
        const ch = getChapters(SUBJECTS.CS, 3);
        if (ch) tasks.push(mkExam(SUBJECTS.CS, ch, 'open-book', 'CS paper. Open book. Evening: C++ practice.'));
        tasks.push(mkSales(dow)); tasks.push(mkCoding(month));
      } else if (dow === 4) {
        const ch = getChapters(SUBJECTS.ACC, 3);
        if (ch) tasks.push(mkExam(SUBJECTS.ACC, ch, 'open-book', 'Accountancy paper. Open book.'));
        tasks.push(mkSales(dow)); tasks.push(mkCoding(month));
      } else if (dow === 5) {
        const psy = getChapters(SUBJECTS.PSY, 3), bs = getChapters(SUBJECTS.BS, 3);
        if (psy) tasks.push(mkExam(SUBJECTS.PSY, psy, 'open-book', 'Psychology paper. Open book.'));
        if (bs) tasks.push(mkExam(SUBJECTS.BS, bs, 'open-book', 'Business Studies paper. Open book.'));
        tasks.push(mkSales(dow)); tasks.push(mkCoding(month));
      }
      addDay(dateStr, tasks);
    }
  }

  // PHASE 2: Weeks 12-24
  const allSubs = [SUBJECTS.ACC, SUBJECTS.ECO, SUBJECTS.CS, SUBJECTS.ENG, SUBJECTS.PSY, SUBJECTS.BS];
  for (let week = 11; week < 24; week++) {
    for (let day = 0; day < 7; day++) {
      const dateStr = addDays(START_DATE, week * 7 + day);
      const dow = getDow(dateStr);
      const month = getMonth(dateStr);
      const tasks: Task[] = [];

      if (dow === 0) {
        tasks.push({ type: 'exam', title: "Review Week's Errors", description: 'Review wrong answers.', examType: 'closed-book', status: 'pending', proofUrls: [], marks: null, feedback: '', isCarryOver: false, carryOverFromDate: null });
        tasks.push(mkSales(dow));
      } else if (dow === 6) {
        const sub = allSubs[(week - 11) % allSubs.length];
        tasks.push(mkExam(sub, 'Full Syllabus', 'mock', 'FULL MOCK. Closed book. 3 hours.'));
        tasks.push(mkSales(dow)); tasks.push(mkCoding(month));
      } else {
        let subs: string[] = [];
        if (dow === 1) subs = [SUBJECTS.ACC];
        else if (dow === 2) subs = [SUBJECTS.ECO, SUBJECTS.ENG];
        else if (dow === 3) subs = [SUBJECTS.CS];
        else if (dow === 4) subs = [SUBJECTS.ACC];
        else if (dow === 5) subs = [SUBJECTS.PSY, SUBJECTS.BS];
        for (const sub of subs) {
          const all = ALL_CHAPTERS[sub];
          const indices: number[] = [];
          for (let i = 0; i < 3 && i < all.length; i++) {
            let idx; do { idx = Math.floor(((week * 7 + day + i) * 31) % all.length); } while (indices.includes(idx) && indices.length < all.length);
            indices.push(idx);
          }
          tasks.push(mkExam(sub, indices.map(i => all[i].split(':')[0]).join(', '), 'closed-book', 'CLOSED BOOK. Mixed chapters.'));
        }
        tasks.push(mkSales(dow)); tasks.push(mkCoding(month));
      }
      addDay(dateStr, tasks);
    }
  }

  // PHASE 3: Weeks 25-32
  for (let week = 24; week < 32; week++) {
    for (let day = 0; day < 7; day++) {
      const dateStr = addDays(START_DATE, week * 7 + day);
      const dow = getDow(dateStr);
      const month = getMonth(dateStr);
      const tasks: Task[] = [];
      if (dow === 0) { tasks.push(mkSales(dow)); }
      else if (week < 26) {
        const tmaMap: { [k: number]: string[] } = { 1: [SUBJECTS.ACC, SUBJECTS.ECO], 2: [SUBJECTS.ACC, SUBJECTS.ECO], 3: [SUBJECTS.CS, SUBJECTS.PSY], 4: [SUBJECTS.CS, SUBJECTS.PSY], 5: [SUBJECTS.ENG, SUBJECTS.BS], 6: [SUBJECTS.ENG, SUBJECTS.BS] };
        for (const sub of (tmaMap[dow] || [])) {
          tasks.push({ type: 'exam', title: `TMA: ${sub}`, description: `Complete TMA for ${sub}. Deadline: 31 Jan 2027.`, subject: sub, chapters: 'TMA', examType: 'open-book', status: 'pending', proofUrls: [], marks: null, feedback: '', isCarryOver: false, carryOverFromDate: null });
        }
        tasks.push(mkSales(dow)); tasks.push(mkCoding(month));
      } else {
        let subs: string[] = [];
        if (dow === 1) subs = [SUBJECTS.ACC]; else if (dow === 2) subs = [SUBJECTS.ECO, SUBJECTS.ENG];
        else if (dow === 3) subs = [SUBJECTS.CS]; else if (dow === 4) subs = [SUBJECTS.ACC];
        else if (dow === 5) subs = [SUBJECTS.PSY, SUBJECTS.BS]; else if (dow === 6) subs = [allSubs[(week - 26) % allSubs.length]];
        for (const sub of subs) tasks.push(mkExam(sub, 'Full Syllabus', 'mock', 'Previous year paper. CLOSED BOOK. 3 hours.'));
        tasks.push(mkSales(dow)); tasks.push(mkCoding(month));
      }
      addDay(dateStr, tasks);
    }
  }

  // PHASE 4: Weeks 33-40
  const hard = [SUBJECTS.ACC, SUBJECTS.ECO, SUBJECTS.CS], easy = [SUBJECTS.ENG, SUBJECTS.PSY, SUBJECTS.BS];
  for (let week = 32; week < 40; week++) {
    for (let day = 0; day < 7; day++) {
      const dateStr = addDays(START_DATE, week * 7 + day);
      const dow = getDow(dateStr);
      const month = getMonth(dateStr);
      const tasks: Task[] = [];
      if (dow === 0) {
        tasks.push({ type: 'exam', title: 'Weak Chapter Revision', description: 'Revise lowest-scoring chapters.', status: 'pending', proofUrls: [], marks: null, feedback: '', isCarryOver: false, carryOverFromDate: null });
        tasks.push(mkSales(dow));
      } else {
        const idx = (week - 32) * 6 + (dow <= 5 ? dow - 1 : 5);
        tasks.push(mkExam(hard[idx % hard.length], 'Full Syllabus', 'mock', 'Morning paper. CLOSED BOOK. Previous year/mock.'));
        tasks.push(mkExam(easy[idx % easy.length], 'Full Syllabus', 'mock', 'Afternoon paper. CLOSED BOOK. Revision.'));
        tasks.push(mkSales(dow)); tasks.push(mkCoding(month));
      }
      addDay(dateStr, tasks);
    }
  }

  return schedule;
}

// ---- Main ----

async function main() {
  console.log('Initializing Firebase...');
  const app = initializeApp(firebaseConfig);
  const db = getDatabase(app);

  console.log('Generating 44-week schedule...');
  const schedule = generateSchedule();
  const days = Object.keys(schedule).length;
  let taskCount = 0;
  Object.values(schedule).forEach(d => { taskCount += Object.keys(d.tasks).length; });
  console.log(`Generated ${days} days, ${taskCount} tasks.`);

  // Upload in chunks
  const dates = Object.keys(schedule).sort();
  const chunkSize = 14;
  const totalChunks = Math.ceil(dates.length / chunkSize);

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, dates.length);
    const chunk: Record<string, any> = {};
    dates.slice(start, end).forEach(d => { chunk[d] = schedule[d]; });
    console.log(`Uploading chunk ${i + 1}/${totalChunks} (days ${start + 1}-${end})...`);
    await update(ref(db, 'schedule'), chunk);
  }

  // Upload deadlines
  console.log('Uploading deadlines...');
  const deadlinesData: Record<string, any> = {};
  SEED_DEADLINES.forEach((d, i) => { deadlinesData[`deadline_${i}`] = d; });
  await set(ref(db, 'deadlines'), deadlinesData);

  console.log(`\nDone! ${taskCount} tasks across ${days} days seeded to Firebase.`);
  process.exit(0);
}

main().catch(e => { console.error('Fatal error:', e); process.exit(1); });
