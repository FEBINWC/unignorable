// Day-of-week rotation for sales activities (Mon=0, Sun=6)
export const SALES_ACTIVITIES: { [dayOfWeek: number]: { title: string; description: string } } = {
  0: {
    title: 'Sales Book Reading',
    description: 'Read 1 chapter from current sales book. Write 3 key takeaways applicable to patternsOfLife.',
  },
  1: {
    title: 'Cold Calling Practice',
    description: 'Practice cold call scripts. Do mock calls or real outreach. Log each call.',
  },
  2: {
    title: 'SaaS Demo Analysis',
    description: 'Watch 1 SaaS product demo on YouTube. Write breakdown: hook, pain point, solution, CTA.',
  },
  3: {
    title: 'Content Creation',
    description: 'Write 1 LinkedIn post OR script a short video about patternsOfLife.',
  },
  4: {
    title: 'Role-Play & Objection Handling',
    description: 'Practice selling patternsOfLife. Handle objections. Record if possible.',
  },
  5: {
    title: 'Product Knowledge Deep-Dive',
    description: 'Study patternsOfLife features, competitors, user personas, and pricing strategy.',
  },
  6: {
    title: 'Light Sales Reading',
    description: 'Read sales book chapter or listen to a sales podcast. No pressure — passive learning.',
  },
};

export const SALES_BOOKS = [
  { month: 1, title: 'SPIN Selling', author: 'Neil Rackham' },
  { month: 2, title: 'Influence', author: 'Robert Cialdini' },
  { month: 3, title: 'Fanatical Prospecting', author: 'Jeb Blount' },
  { month: 4, title: '$100M Offers', author: 'Alex Hormozi' },
  { month: 5, title: 'The Challenger Sale', author: 'Dixon & Adamson' },
  { month: 6, title: 'Never Split the Difference', author: 'Chris Voss' },
];
