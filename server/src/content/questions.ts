import type { Question } from './QuizContentSource.js';

/**
 * Canonical question list — source of truth.
 * On every server start, seedAll() upserts these into the DB (INSERT OR REPLACE).
 * Admin UI edits to IDs not listed here are preserved.
 */
export const QUESTIONS: readonly Question[] = [
  // ─── Serbia round ───────────────────────────────────────────────────────────
  {
    id: 'q-s01',
    prompt: 'What is the capital city of Serbia?',
    options: ['Zagreb', 'Sarajevo', 'Belgrade', 'Novi Sad'],
    correctIndex: 2,
    explanation:
      "Belgrade is one of the oldest cities in Europe, continuously inhabited for over 7,000 years. It sits at the confluence of the Sava and Danube rivers and has been destroyed and rebuilt over 40 times throughout history — earning it the nickname 'The City of the Rising Phoenix.'",
  },
  {
    id: 'q-s02',
    prompt: 'Which famous tennis player was born in Belgrade, Serbia?',
    options: ['Rafael Nadal', 'Roger Federer', 'Andy Murray', 'Novak Djokovic'],
    correctIndex: 3,
    explanation:
      'Born in Belgrade in 1987, Djokovic holds the record for most weeks ranked world No. 1 in men\'s tennis history. He learned to play on a makeshift court near a ski resort and has won more Grand Slam singles titles than any man in history.',
  },
  {
    id: 'q-s03',
    prompt: 'On which river does the Serbian capital Belgrade sit?',
    options: ['Danube only', 'Drina', 'Morava', 'Sava and Danube'],
    correctIndex: 3,
    explanation:
      "Belgrade sits exactly where the Sava flows into the Danube. The name 'Belgrade' literally means 'White City' (Beo = white, grad = city). The ancient fortress Kalemegdan sits at that confluence and has been a strategic military position for over 2,000 years.",
  },
  {
    id: 'q-s04',
    prompt: 'Which inventor, famous for alternating current (AC) electricity, was born in Serbia?',
    options: ['Thomas Edison', 'Guglielmo Marconi', 'Nikola Tesla', 'Alexander Graham Bell'],
    correctIndex: 2,
    explanation:
      'Nikola Tesla was born in 1856 in a small Serbian village called Smiljan. He spoke eight languages, had a photographic memory, and reportedly never slept more than two hours a night. Despite his revolutionary contributions to modern electricity, he died broke and largely forgotten in a New York hotel room.',
  },

  // ─── OIP Insurtech round ────────────────────────────────────────────────────
  {
    id: 'q-oip01',
    prompt: "What is OIP Insurtech's AI product that automates insurance workflows?",
    options: ['FlowAI', 'PolicyPilot', 'BoundAI', 'InsurBot'],
    correctIndex: 2,
    explanation:
      "BoundAI is OIP Insurtech's flagship AI platform. It structures the full insurance workflow from submission to bind — ingesting documents, classifying them, and writing structured output directly back to your systems. No shadow systems. No rip-and-replace.",
  },
  {
    id: 'q-oip02',
    prompt: "When does a human reviewer step into BoundAI's processing pipeline?",
    options: [
      'After every document is processed',
      'Only at the submission intake stage',
      'Never — it\'s fully automated',
      'Only on exceptions and low-confidence cases',
    ],
    correctIndex: 3,
    explanation:
      "BoundAI's Human-in-the-Loop (HITL) step is triggered only when the machine flags uncertainty. Reviewers are experienced insurance professionals — not generic QA staff. They correct edge cases and keep the pipeline auditable without slowing down clean cases.",
  },
  {
    id: 'q-oip03',
    prompt: "What is BoundAI's typical production go-live timeline?",
    options: ['3–6 months', '6–12 months', '~90 days', 'It varies — no standard timeline'],
    correctIndex: 2,
    explanation:
      '~90 days to full production — not a pilot, not a POC. BoundAI deploys inside the systems you already run — PAS, AMS, CRM, DMS — with no infrastructure replacement required.',
  },
  {
    id: 'q-oip04',
    prompt: 'Which of the following is NOT a processing flow supported by BoundAI?',
    options: ['Loss Run Analysis', 'SOV Processing', 'Inspection Review', 'Claims Adjudication'],
    correctIndex: 3,
    explanation:
      "Claims Adjudication is not a BoundAI flow. BoundAI focuses on the underwriting and distribution side: Submissions Processing, Loss Run Analysis, SOV (Carrier & Broker), Email Extraction, Inspection Review, and custom document workflows.",
  },
  {
    id: 'q-oip05',
    prompt: 'OIP Insurtech offers three ways to engage their delivery teams. Which set is correct?',
    options: [
      'Onshore, Offshore, Nearshore',
      'Sprint, Agile, Waterfall',
      'Team-as-a-Service, Distributed Teams, Autonomous Delivery',
      'Fixed, Flexible, Fractional',
    ],
    correctIndex: 2,
    explanation:
      "Three shapes, one bench. Team-as-a-Service gives you dedicated pods with OIP's ops muscle. Distributed Teams embed directly into your engineering structure. Autonomous Delivery is fixed-scope, outcome-linked delivery.",
  },
  {
    id: 'q-oip06',
    prompt: 'How many hours of technology delivery has OIP Insurtech shipped?',
    options: ['250,000+', '500,000+', '750,000+', '1,000,000+'],
    correctIndex: 3,
    explanation:
      'Over 1 million hours of technology delivery shipped. With 1,500+ professionals and a 100% insurance-trained talent pipeline, OIP teams ramp in under 30 days — because insurance is where engineers start on day one.',
  },
  {
    id: 'q-oip07',
    prompt: "What does OIP Insurtech's Center of Excellence (CoE) model offer clients?",
    options: [
      'A one-time system audit and report',
      'Software licensing with annual renewals',
      'A dedicated offshore team that hands off on contract end',
      'Running an internal CoE until the client team is ready to own it',
    ],
    correctIndex: 3,
    explanation:
      "OIP builds and runs the CoE inside your organization, then transfers ownership when your team is ready. The best programs don't end at go-live — OIP stays to harden, extend, and hand over capability that actually sticks.",
  },
];
