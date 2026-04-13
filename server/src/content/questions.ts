import type { Question } from './QuizContentSource.js';

/**
 * Hardcoded quiz content. Keep question ids stable — they are persisted
 * in the answers table and used for grading replay.
 *
 * To change content: edit this file, rebuild, restart. No migration needed.
 */
export const QUESTIONS: readonly Question[] = [
  {
    id: 'q-001',
    prompt: 'Which planet is known as the Red Planet?',
    options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
    correctIndex: 1,
    explanation: 'Mars appears red because of iron oxide (rust) on its surface.',
  },
  {
    id: 'q-002',
    prompt: 'True or False: The Great Wall of China is visible from space with the naked eye.',
    options: ['True', 'False'],
    correctIndex: 1,
    explanation: 'It is not. The wall is long but too narrow to resolve from orbit unaided.',
  },
  {
    id: 'q-003',
    prompt: 'Who painted the Mona Lisa?',
    options: ['Michelangelo', 'Raphael', 'Leonardo da Vinci', 'Donatello'],
    correctIndex: 2,
    explanation: 'Leonardo painted it between ~1503 and 1519. It now hangs in the Louvre.',
  },
  {
    id: 'q-004',
    prompt: 'What is the chemical symbol for gold?',
    options: ['Gd', 'Go', 'Au', 'Ag'],
    correctIndex: 2,
    explanation: 'Au, from the Latin aurum.',
  },
  {
    id: 'q-005',
    prompt: 'Which ocean is the largest by area?',
    options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'],
    correctIndex: 3,
    explanation: 'The Pacific covers roughly a third of the planet\u2019s surface.',
  },
  {
    id: 'q-006',
    prompt: 'True or False: Bananas are botanically classified as berries.',
    options: ['True', 'False'],
    correctIndex: 0,
    explanation: 'Yes — bananas meet the botanical definition of a berry. Strawberries do not.',
  },
  {
    id: 'q-007',
    prompt: 'How many bones are in the adult human body?',
    options: ['196', '206', '216', '226'],
    correctIndex: 1,
    explanation: 'Adults have 206 bones; newborns have around 270, which fuse over time.',
  },
  {
    id: 'q-008',
    prompt: 'Which country is home to the kangaroo?',
    options: ['New Zealand', 'South Africa', 'Australia', 'Argentina'],
    correctIndex: 2,
    explanation: 'Kangaroos are native to Australia.',
  },
  {
    id: 'q-009',
    prompt: 'What year did humans first land on the Moon?',
    options: ['1965', '1969', '1972', '1975'],
    correctIndex: 1,
    explanation: 'Apollo 11 landed on July 20, 1969.',
  },
  {
    id: 'q-010',
    prompt: 'True or False: Lightning never strikes the same place twice.',
    options: ['True', 'False'],
    correctIndex: 1,
    explanation: 'It absolutely does — the Empire State Building is hit dozens of times a year.',
  },
  // ─── placeholder questions, easy to revisit/replace later ───
  {
    id: 'q-011',
    prompt: 'PLACEHOLDER: What is the capital of France?',
    options: ['London', 'Paris', 'Berlin', 'Madrid'],
    correctIndex: 1,
    explanation: 'Paris.',
  },
  {
    id: 'q-012',
    prompt: 'PLACEHOLDER: True or False — Mount Everest is in the Andes.',
    options: ['True', 'False'],
    correctIndex: 1,
    explanation: 'It is in the Himalayas, on the Nepal/China border.',
  },
  {
    id: 'q-013',
    prompt: 'PLACEHOLDER: Which language has the most native speakers worldwide?',
    options: ['English', 'Spanish', 'Mandarin Chinese', 'Hindi'],
    correctIndex: 2,
    explanation: 'Mandarin Chinese, by a wide margin.',
  },
  {
    id: 'q-014',
    prompt: 'PLACEHOLDER: How many continents are there?',
    options: ['5', '6', '7', '8'],
    correctIndex: 2,
    explanation: 'Seven, in the most common model.',
  },
  {
    id: 'q-015',
    prompt: 'PLACEHOLDER: True or False — a tomato is a fruit.',
    options: ['True', 'False'],
    correctIndex: 0,
    explanation: 'Botanically, yes — it develops from the flower\u2019s ovary and contains seeds.',
  },
  {
    id: 'q-016',
    prompt: 'PLACEHOLDER: Which element has the chemical symbol "O"?',
    options: ['Osmium', 'Oxygen', 'Gold', 'Iron'],
    correctIndex: 1,
    explanation: 'Oxygen.',
  },
  {
    id: 'q-017',
    prompt: 'PLACEHOLDER: Who wrote "Romeo and Juliet"?',
    options: ['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain'],
    correctIndex: 1,
    explanation: 'William Shakespeare, around 1595.',
  },
  {
    id: 'q-018',
    prompt: 'PLACEHOLDER: How many sides does a hexagon have?',
    options: ['5', '6', '7', '8'],
    correctIndex: 1,
    explanation: 'Six.',
  },
  {
    id: 'q-019',
    prompt: 'PLACEHOLDER: True or False — sound travels faster in water than in air.',
    options: ['True', 'False'],
    correctIndex: 0,
    explanation: 'Yes, roughly four times faster.',
  },
  {
    id: 'q-020',
    prompt: 'PLACEHOLDER: What is the largest planet in our solar system?',
    options: ['Saturn', 'Jupiter', 'Neptune', 'Earth'],
    correctIndex: 1,
    explanation: 'Jupiter.',
  },
];
