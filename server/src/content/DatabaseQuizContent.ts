import type { QuizContentSource, Question } from './QuizContentSource.js';
import type { QuestionRepo } from '../db/repos/QuestionRepo.js';

export class DatabaseQuizContent implements QuizContentSource {
  private cache: readonly Question[] = [];
  private byId: ReadonlyMap<string, Question> = new Map();

  constructor(private readonly repo: QuestionRepo) {
    this.reload();
  }

  /** Refresh the in-memory cache from the DB. Call after every successful edit. */
  reload(): void {
    const qs = this.repo.findAll();
    this.cache = qs;
    this.byId = new Map(qs.map(q => [q.id, q]));
  }

  getQuestions(): readonly Question[] {
    return this.cache;
  }

  getQuestion(id: string): Question | undefined {
    return this.byId.get(id);
  }
}
