export interface Question {
  readonly id: string;
  readonly prompt: string;
  readonly options: readonly string[];
  readonly correctIndex: number;
  readonly explanation: string;
}

/** Question shape exposed to players — correctIndex and explanation stripped. */
export interface PublicQuestion {
  readonly id: string;
  readonly prompt: string;
  readonly options: readonly string[];
}

export interface QuizContentSource {
  getQuestions(): readonly Question[];
  getQuestion(id: string): Question | undefined;
}

export function toPublic(q: Question): PublicQuestion {
  return { id: q.id, prompt: q.prompt, options: q.options };
}
