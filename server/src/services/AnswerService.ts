import type { AnswerRepo } from '../db/repos/AnswerRepo.js';
import type { ParticipantService } from './ParticipantService.js';
import type { QuizContentSource } from '../content/QuizContentSource.js';
import type { EventBus } from './EventBus.js';

export class UnknownQuestionError extends Error {
  constructor(id: string) { super(`Unknown question id: ${id}`); }
}

export class DuplicateAnswerError extends Error {
  constructor(participantId: number, questionId: string) {
    super(`Participant ${participantId} already answered ${questionId}`);
  }
}

export interface SubmitAnswerInput {
  participantId: number;
  questionId: string;
  selectedIndex: number | null;
  responseTimeMs: number;
}

export interface GradedAnswer {
  isCorrect: boolean;
  correctIndex: number;
  explanation: string;
}

export class AnswerService {
  constructor(
    private readonly answers: AnswerRepo,
    private readonly participantService: ParticipantService,
    private readonly content: QuizContentSource,
    private readonly bus: EventBus,
  ) {}

  submit(input: SubmitAnswerInput): GradedAnswer {
    const participant = this.participantService.getById(input.participantId);
    const question = this.content.getQuestion(input.questionId);
    if (!question) throw new UnknownQuestionError(input.questionId);

    const isCorrect = input.selectedIndex === question.correctIndex;

    try {
      this.answers.record({
        participantId: input.participantId,
        questionId: input.questionId,
        selectedIndex: input.selectedIndex,
        isCorrect,
        responseTimeMs: Math.max(0, Math.floor(input.responseTimeMs)),
      });
    } catch (err) {
      if (err instanceof Error && /UNIQUE/i.test(err.message)) {
        throw new DuplicateAnswerError(input.participantId, input.questionId);
      }
      throw err;
    }

    this.bus.emitSessionEvent(participant.session_id, { type: 'leaderboard-changed' });

    return {
      isCorrect,
      correctIndex: question.correctIndex,
      explanation: question.explanation,
    };
  }
}
