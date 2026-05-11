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
  // Add more papers here as you create them:
  // {
  //   id: 'acc-do2',
  //   title: 'Business Transactions, Journal & Ledger',
  //   subject: 'Accountancy',
  //   chapters: 'Ch 4, Ch 5, Ch 6',
  //   dayOrders: '4',
  //   file: 'acc-do2-ch4-6.html',
  // },
];
