import type { Question, QuizContentSource } from './QuizContentSource.js';
import { QUESTIONS } from './questions.js';

export class HardcodedQuizContent implements QuizContentSource {
  private readonly byId: ReadonlyMap<string, Question>;

  constructor(private readonly questions: readonly Question[] = QUESTIONS) {
    this.byId = new Map(questions.map(q => [q.id, q]));
  }

  getQuestions(): readonly Question[] {
    return this.questions;
  }

  getQuestion(id: string): Question | undefined {
    return this.byId.get(id);
  }
}
