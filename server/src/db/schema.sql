PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS sessions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  created_at    INTEGER NOT NULL,
  activated_at  INTEGER,
  ended_at      INTEGER
);

CREATE INDEX IF NOT EXISTS idx_sessions_active
  ON sessions(activated_at, ended_at);

CREATE TABLE IF NOT EXISTS participants (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id     INTEGER NOT NULL REFERENCES sessions(id),
  first_name     TEXT NOT NULL,
  last_name      TEXT NOT NULL,
  registered_at  INTEGER NOT NULL,
  started_at     INTEGER,
  completed_at   INTEGER
);

CREATE INDEX IF NOT EXISTS idx_participants_session
  ON participants(session_id);

CREATE TABLE IF NOT EXISTS answers (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  participant_id    INTEGER NOT NULL REFERENCES participants(id),
  question_id       TEXT NOT NULL,
  selected_index    INTEGER,
  is_correct        INTEGER NOT NULL,
  response_time_ms  INTEGER NOT NULL,
  answered_at       INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_answers_participant_question
  ON answers(participant_id, question_id);
