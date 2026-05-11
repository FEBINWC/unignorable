import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, update, remove } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyCkiQK6u6v-5Hr3WNCulUVif_1h3a3X0yY',
  authDomain: 'unignorable.firebaseapp.com',
  databaseURL: 'https://unignorable-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'unignorable',
  storageBucket: 'unignorable.firebasestorage.app',
  messagingSenderId: '1083458925635',
  appId: '1:1083458925635:web:3c2411df0f46d2f6c990f6',
};

// --- Chapter Data ---
const ALL_CHAPTERS: Record<string, string[]> = {
  Accountancy: ['Ch 1: Accounting Introduction','Ch 2: Accounting Concepts','Ch 3: Conventions & Standards','Ch 4: Business Transactions','Ch 5: Journal','Ch 6: Ledger','Ch 7: Cash Book','Ch 8: Special Purpose Books','Ch 9: Trial Balance','Ch 10: Bank Reconciliation','Ch 11: Bills of Exchange','Ch 12: Errors & Rectification','Ch 13: Computerised Accounting','Ch 14: Depreciation','Ch 15: Provision & Reserves','Ch 16: Financial Statements Intro','Ch 17: Financial Statements I','Ch 18: Financial Statements II','Ch 19: NFP Organisations Intro','Ch 20: Financial Statements NFP','Ch 21: Incomplete Records','Ch 22: Partnership Intro','Ch 23: Admission of Partner','Ch 24: Retirement & Death','Ch 25: Dissolution','Ch 26: Company Intro','Ch 27: Issue of Shares','Ch 28: Forfeiture of Shares','Ch 29: Reissue of Forfeited','Ch 30: Issue of Debentures','Ch 31: Financial Analysis Intro','Ch 32: Accounting Ratios I','Ch 33: Accounting Ratios II','Ch 34: Cash Flow Statement','Ch 35: Spreadsheet','Ch 36: Spreadsheet in Business','Ch 37: Graphs & Charts','Ch 38: DBMS for Accounting'],
  Economics: ['Ch 1: Overview of Indian Economy','Ch 2: Economic Planning','Ch 3: Economic Growth','Ch 4: Unemployment & Poverty','Ch 5: Statistics Intro','Ch 6: Data Collection','Ch 7: Data Presentation','Ch 8: Central Tendency','Ch 9: Dispersion','Ch 10: Correlation','Ch 11: Index Numbers','Ch 12: Intro to Economics','Ch 13: Central Problems','Ch 14: Consumer Equilibrium','Ch 15: Demand','Ch 16: Price Elasticity','Ch 17: Production Function','Ch 18: Cost of Production','Ch 19: Supply','Ch 20: Price Elasticity of Supply','Ch 21: Forms of Market','Ch 22: Perfect Competition','Ch 23: Revenue & Profit','Ch 24: National Income','Ch 25: National Income Measurement','Ch 26: Consumption & Investment','Ch 27: Income Determination','Ch 28: Money & Banking','Ch 29: Government & Budget'],
  'Computer Science': ['Ch 1: Fundamentals','Ch 2: Binary Logic','Ch 3: Software','Ch 4: Operating Systems','Ch 5: Networking','Ch 6: Internet','Ch 7: Emailing','Ch 8: Digital Docs','Ch 9: Spreadsheets','Ch 10: Presentations','Ch 11: Open Source','Ch 12: Intro C++','Ch 13: OOP Concepts','Ch 14: Control Statements','Ch 15: Functions','Ch 16: Array','Ch 17: Structure & Typedef','Ch 18: Classes & Objects','Ch 19: Inheritance','Ch 20: Pointer','Ch 21: Files','Ch 22: Data Structures','Ch 23: DBMS','Ch 24: HTML','Ch 25: HTML Images & Lists','Ch 26: New Trends','Ch 27: Project Management','Ch 28: Entrepreneurship','Ch 29: Communication Skills'],
  English: ['Ch 1: My First Steps','Ch 2: Leisure','Ch 3: Reading','Ch 4: Father Dear Father','Ch 5: Fuel of Future','Ch 6: Grandmother\'s House','Ch 7: Reading','Ch 8: Case of Suspicion','Ch 9: My Son','Ch 10: Where Mind is Free','Ch 11: Reading','Ch 12: If I Were You','Ch 13: Tiger in Tunnel','Ch 14: Road Not Taken','Ch 15: Reading','Ch 16: I Must Know Truth','Ch 17: India Past & Future','Ch 18: Night of Scorpion','Ch 19: Reading','Ch 20: Reading','Ch 21: Reading','Ch 22: Reading','Ch 23: Reading','Ch 24: Reading','Ch 25: Bholi','Ch 26A: ESP Receptionist','Ch 27A: ESP Office','Ch 28A: ESP Correspondence','Ch 29A: ESP Reports','Ch 30A: ESP Presentation','Ch 31B: ESP Professional'],
  Psychology: ['Ch 1: Understanding Self','Ch 2: How Psychologists Study','Ch 3: Biological Shaping','Ch 4: Awareness','Ch 5: Attention & Perception','Ch 6: Learning Process','Ch 7: Memory','Ch 8: Thinking & Reasoning','Ch 9: Motivation','Ch 10: Emotion','Ch 11: Development','Ch 12: Domains of Development','Ch 13: Adolescence','Ch 14: Adulthood & Ageing','Ch 15: Intelligence','Ch 16: What is Self','Ch 17: Self & Processes','Ch 18: Personality Theories','Ch 19: Personality Assessment','Ch 20: Disorders','Ch 21: Group Processes','Ch 22: Person Perception','Ch 23: Human-Environment','Ch 24: Psychotherapy','Ch 25: Health Psychology','Ch 26A: Education & Work','Ch 27A: Career Development','Ch 28A: Vocational Choice','Ch 29A: Stress & Health','Ch 30A: Stress Management'],
  'Business Studies': ['Ch 1: Nature of Business','Ch 2: Support Services','Ch 3: Business Environment','Ch 4: Forms of Org','Ch 5: Company Form','Ch 6: Management Fundamentals','Ch 7: Planning & Organising','Ch 8: Staffing & Directing','Ch 9: Coordination & Control','Ch 10: Financial Planning','Ch 11: Short Term Finance','Ch 12: Long Term Finance','Ch 13: Financial Market','Ch 14: Intro to Marketing','Ch 15: Marketing Mix','Ch 16: Advertising & Sales','Ch 17: Consumer Protection','Ch 18: Internal Trade','Ch 19: External Trade','Ch 20: Self-Employment','Ch 21: Job Employment','Ch 22: Skill Development','Ch 23: Modern Business'],
};

const SALES = [
  { title: 'Sales Book Reading', desc: 'Read 1 chapter. Write 3 takeaways for patternsOfLife.' },
  { title: 'Cold Calling Practice', desc: 'Practice cold call scripts. Mock or real outreach.' },
  { title: 'SaaS Demo Analysis', desc: 'Watch 1 SaaS demo. Write breakdown: hook, pain, solution, CTA.' },
  { title: 'Content Creation', desc: 'Write 1 LinkedIn post or script a video about patternsOfLife.' },
  { title: 'Role-Play & Objection Handling', desc: 'Practice selling patternsOfLife.' },
  { title: 'Product Knowledge', desc: 'Study patternsOfLife features, competitors, pricing.' },
];

const CODING = [
  { title: 'Project Setup', desc: 'Set up patternsOfLife. Build onboarding.' },
  { title: 'Journal Feature', desc: 'Text entry, save, view history.' },
  { title: 'Habit Tracker', desc: 'Create habits, mark daily, streaks.' },
  { title: 'AI Coach', desc: 'Prompt engineering, API calls.' },
  { title: 'Self-Awareness', desc: 'Mood tracking, patterns.' },
  { title: 'Identity Gap', desc: 'Ideal self vs reality.' },
  { title: 'Push Notifications', desc: 'Reminders and alerts.' },
  { title: 'Polish & Beta', desc: 'Bug fixes, UI polish.' },
  { title: 'Launch Prep', desc: 'App store, deployment.' },
  { title: 'Iterate', desc: 'User feedback changes.' },
];

const DEADLINES = [
  { title: 'Phase 1 Complete', date: '2026-08-16', type: 'phase', description: 'All chapters covered.', completed: false },
  { title: 'Phase 2 Complete', date: '2026-11-22', type: 'phase', description: 'Closed-book done.', completed: false },
  { title: 'Start TMA Prep', date: '2026-12-01', type: 'tma', description: 'Begin TMAs.', completed: false },
  { title: 'TMA Deadline', date: '2027-01-31', type: 'tma', description: 'Submit all 6 TMAs. 20% weightage.', completed: false },
  { title: 'CS Practicals', date: '2027-02-01', type: 'practical', description: '5 PCP sessions. 40 marks.', completed: false },
  { title: 'Exam Begins', date: '2027-03-15', type: 'exam', description: 'NIOS March-April 2027.', completed: false },
  { title: 'Exam Registration', date: '2027-01-10', type: 'exam', description: 'Register + pay fees.', completed: false },
];

// --- Types ---
interface Task { type: string; title: string; description: string; subject?: string; chapters?: string; examType?: string; status: string; proofUrls: string[]; marks: null; feedback: string; }
interface DayOrder { dayOrder: number; dayType: string; phase: number; tasks: Record<string, Task>; }

function mkExam(subject: string, chapters: string, examType: string, desc: string): Task {
  return { type: 'exam', title: `${subject} Exam`, description: desc, subject, chapters, examType, status: 'pending', proofUrls: [], marks: null, feedback: '' };
}
function mkSales(idx: number): Task {
  const s = SALES[idx % SALES.length];
  return { type: 'sales', title: s.title, description: s.desc, status: 'pending', proofUrls: [], marks: null, feedback: '' };
}
function mkCoding(phase: number): Task {
  const c = CODING[Math.min(phase - 1, CODING.length - 1)];
  return { type: 'coding', title: `patternsOfLife: ${c.title}`, description: c.desc, status: 'pending', proofUrls: [], marks: null, feedback: '' };
}

function generateDayOrders(): Record<string, DayOrder> {
  const dayOrders: Record<string, DayOrder> = {};
  let num = 1;
  const progress: Record<string, number> = {};
  for (const s of Object.keys(ALL_CHAPTERS)) progress[s] = 0;

  function getChapters(subject: string, count: number): string {
    const all = ALL_CHAPTERS[subject];
    const start = progress[subject];
    const end = Math.min(start + count, all.length);
    const names = all.slice(start, end);
    progress[subject] = end;
    return names.length > 0 ? names.map(n => n.split(':')[0]).join(', ') : '';
  }

  function addDayOrder(dayType: string, phase: number, tasks: Task[]) {
    const taskMap: Record<string, Task> = {};
    tasks.forEach((t, i) => { taskMap[`task_${i}`] = t; });
    dayOrders[String(num)] = { dayOrder: num, dayType, phase, tasks: taskMap };
    num++;
  }

  // PHASE 1: ~66 day orders (open-book, sequential)
  // Pattern repeats: ACC, ECO+ENG, CS, ACC, PSY+BS, Cumulative
  const subjects = ['Accountancy', 'Economics', 'Computer Science', 'English', 'Psychology', 'Business Studies'];
  const cumRotation = [...subjects];
  let salesIdx = 0;
  let cumIdx = 0;

  for (let week = 0; week < 11; week++) {
    // Day 1: Accountancy
    const acc1 = getChapters('Accountancy', 3);
    if (acc1) { addDayOrder('full', 1, [mkExam('Accountancy', acc1, 'open-book', 'Study and write. Open book.'), mkSales(salesIdx++), mkCoding(1)]); }

    // Day 2: Economics + English
    const eco = getChapters('Economics', 3);
    const eng = getChapters('English', 3);
    const d2tasks: Task[] = [];
    if (eco) d2tasks.push(mkExam('Economics', eco, 'open-book', 'Economics paper. Open book.'));
    if (eng) d2tasks.push(mkExam('English', eng, 'open-book', 'English paper. Open book.'));
    if (d2tasks.length) { d2tasks.push(mkSales(salesIdx++), mkCoding(1)); addDayOrder('full', 1, d2tasks); }

    // Day 3: Computer Science
    const cs = getChapters('Computer Science', 3);
    if (cs) { addDayOrder('full', 1, [mkExam('Computer Science', cs, 'open-book', 'CS paper. Open book. Evening: C++ practice.'), mkSales(salesIdx++), mkCoding(1)]); }

    // Day 4: Accountancy
    const acc2 = getChapters('Accountancy', 3);
    if (acc2) { addDayOrder('full', 1, [mkExam('Accountancy', acc2, 'open-book', 'Accountancy paper. Open book.'), mkSales(salesIdx++), mkCoding(1)]); }

    // Day 5: Psychology + Business Studies
    const psy = getChapters('Psychology', 3);
    const bs = getChapters('Business Studies', 3);
    const d5tasks: Task[] = [];
    if (psy) d5tasks.push(mkExam('Psychology', psy, 'open-book', 'Psychology paper. Open book.'));
    if (bs) d5tasks.push(mkExam('Business Studies', bs, 'open-book', 'Business Studies paper. Open book.'));
    if (d5tasks.length) { d5tasks.push(mkSales(salesIdx++), mkCoding(1)); addDayOrder('full', 1, d5tasks); }

    // Day 6: Cumulative (closed book)
    const cumSub = cumRotation[cumIdx++ % cumRotation.length];
    addDayOrder('cumulative', 1, [mkExam(cumSub, 'All chapters covered so far', 'cumulative', `CLOSED BOOK cumulative test on ${cumSub}.`), mkSales(salesIdx++), mkCoding(1)]);
  }

  // PHASE 2: ~78 day orders (closed-book, mixed chapters)
  for (let i = 0; i < 78; i++) {
    const patternIdx = i % 6;
    let subs: string[];
    if (patternIdx === 0) subs = ['Accountancy'];
    else if (patternIdx === 1) subs = ['Economics', 'English'];
    else if (patternIdx === 2) subs = ['Computer Science'];
    else if (patternIdx === 3) subs = ['Accountancy'];
    else if (patternIdx === 4) subs = ['Psychology', 'Business Studies'];
    else { // Cumulative / mock
      const sub = subjects[i % subjects.length];
      addDayOrder('cumulative', 2, [mkExam(sub, 'Full Syllabus', 'mock', 'FULL MOCK. Closed book. 3 hours.'), mkSales(salesIdx++), mkCoding(2)]);
      continue;
    }

    const tasks: Task[] = [];
    for (const sub of subs) {
      const all = ALL_CHAPTERS[sub];
      const idx1 = (i * 7 + 3) % all.length;
      const idx2 = (i * 7 + 11) % all.length;
      const idx3 = (i * 7 + 19) % all.length;
      const chapters = [all[idx1], all[idx2], all[idx3]].map(c => c.split(':')[0]).join(', ');
      tasks.push(mkExam(sub, chapters, 'closed-book', 'CLOSED BOOK. Mixed chapters review.'));
    }
    tasks.push(mkSales(salesIdx++), mkCoding(2));
    addDayOrder('full', 2, tasks);
  }

  // PHASE 3a: 12 TMA day orders
  const tmaSubjects = ['Accountancy', 'Economics', 'Computer Science', 'Psychology', 'English', 'Business Studies'];
  for (let i = 0; i < 12; i++) {
    const sub = tmaSubjects[i % tmaSubjects.length];
    addDayOrder('full', 3, [
      { type: 'exam', title: `TMA: ${sub}`, description: `Complete TMA for ${sub}. Deadline: 31 Jan 2027.`, subject: sub, chapters: 'TMA', examType: 'open-book', status: 'pending', proofUrls: [], marks: null, feedback: '' },
      mkSales(salesIdx++), mkCoding(3),
    ]);
  }

  // PHASE 3b: 36 Previous year paper day orders
  for (let i = 0; i < 36; i++) {
    const sub = subjects[i % subjects.length];
    addDayOrder('full', 3, [mkExam(sub, 'Full Syllabus', 'mock', 'Previous year paper. CLOSED BOOK. 3 hours.'), mkSales(salesIdx++), mkCoding(3)]);
  }

  // PHASE 4: 48 Sprint day orders (2 exams per day)
  const hard = ['Accountancy', 'Economics', 'Computer Science'];
  const easy = ['English', 'Psychology', 'Business Studies'];
  for (let i = 0; i < 48; i++) {
    addDayOrder('full', 4, [
      mkExam(hard[i % hard.length], 'Full Syllabus', 'mock', 'Morning paper. CLOSED BOOK.'),
      mkExam(easy[i % easy.length], 'Full Syllabus', 'mock', 'Afternoon paper. CLOSED BOOK.'),
      mkSales(salesIdx++), mkCoding(4),
    ]);
  }

  console.log(`Generated ${num - 1} day orders`);
  return dayOrders;
}

// --- Main ---
async function main() {
  console.log('Initializing Firebase...');
  const app = initializeApp(firebaseConfig);
  const db = getDatabase(app);

  // Clear old data
  console.log('Clearing old schedule data...');
  await remove(ref(db, 'schedule'));

  // Generate day orders
  const dayOrders = generateDayOrders();
  const total = Object.keys(dayOrders).length;

  // Upload in chunks
  const keys = Object.keys(dayOrders);
  const chunkSize = 20;
  for (let i = 0; i < keys.length; i += chunkSize) {
    const chunk: Record<string, any> = {};
    keys.slice(i, i + chunkSize).forEach(k => { chunk[k] = dayOrders[k]; });
    console.log(`Uploading day orders ${i + 1}-${Math.min(i + chunkSize, keys.length)} of ${total}...`);
    await update(ref(db, 'dayOrders'), chunk);
  }

  // Set progress
  console.log('Setting progress...');
  await set(ref(db, 'progress'), {
    currentDayOrder: 1,
    targetEndDate: '2027-03-15',
    startDate: '2026-05-11',
    totalDayOrders: total,
  });

  // Set deadlines
  console.log('Uploading deadlines...');
  const deadlinesData: Record<string, any> = {};
  DEADLINES.forEach((d, i) => { deadlinesData[`deadline_${i}`] = d; });
  await set(ref(db, 'deadlines'), deadlinesData);

  // Set initial vacation (May 19-23)
  console.log('Setting initial vacation...');
  await set(ref(db, 'vacations'), {
    vac_0: { start: '2026-05-19', end: '2026-05-23', reason: 'Planned vacation' },
  });

  // Initialize streaks
  await set(ref(db, 'streaks'), { current: 0, longest: 0, lastCompletedDate: '' });

  console.log(`\nDone! ${total} day orders seeded. Start date: 2026-05-11. Vacation: May 19-23.`);
  process.exit(0);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
