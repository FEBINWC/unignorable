export interface Paper {
  id: string;
  title: string;
  subject: string;
  chapters: string;
  dayOrders: string;
  file: string; // filename in public/question-papers/
}

export const PAPERS: Paper[] = [
  {
    id: 'acc-do1',
    title: 'Accounting Introduction, Concepts & Conventions',
    subject: 'Accountancy',
    chapters: 'Ch 1, Ch 2, Ch 3',
    dayOrders: '1',
    file: 'acc-do1-ch1-3.html',
  },
  {
    id: 'eco-do2',
    title: 'Indian Economy, Economic Planning & Growth',
    subject: 'Economics',
    chapters: 'Ch 1, Ch 2, Ch 3',
    dayOrders: '2',
    file: 'eco-do2-ch1-3.html',
  },
  {
    id: 'eng-do2',
    title: 'My First Steps, Leisure (Poetry) & Reading Comprehension',
    subject: 'English',
    chapters: 'Ch 1, Ch 2, Ch 3',
    dayOrders: '2',
    file: 'eng-do2-ch1-3.html',
  },
  {
    id: 'cs-do3',
    title: 'Computer Fundamentals, Binary Logic & Software',
    subject: 'Computer Science',
    chapters: 'Ch 1, Ch 2, Ch 3',
    dayOrders: '3',
    file: 'cs-do3-ch1-3.html',
  },
  {
    id: 'psy-do5',
    title: 'Understanding Self, Research Methods & Biological Basis',
    subject: 'Psychology',
    chapters: 'Ch 1, Ch 2, Ch 3',
    dayOrders: '5',
    file: 'psy-do5-ch1-3.html',
  },
  {
    id: 'bs-do5',
    title: 'Nature of Business, Support Services & Environment',
    subject: 'Business Studies',
    chapters: 'Ch 1, Ch 2, Ch 3',
    dayOrders: '5',
    file: 'bs-do5-ch1-3.html',
  },
  {
    id: 'acc-do4',
    title: 'Business Transactions, Journal & Ledger',
    subject: 'Accountancy',
    chapters: 'Ch 4, Ch 5, Ch 6',
    dayOrders: '4',
    file: 'acc-do4-ch4-6.html',
  },
];
