-- Cienvia: esquema do protótipo (PostgreSQL). Compatível com PostgreSQL gerenciado.
CREATE TABLE IF NOT EXISTS person (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  name text NOT NULL DEFAULT '',
  affiliation text NOT NULL DEFAULT '',
  orcid text,
  lattes_url text,
  is_platform_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS login_token (
  token text PRIMARY KEY,
  email text NOT NULL,
  redirect_to text NOT NULL DEFAULT '/minha-area',
  expires_at timestamptz NOT NULL,
  used_at timestamptz
);
CREATE TABLE IF NOT EXISTS session (
  id text PRIMARY KEY,
  person_id uuid NOT NULL REFERENCES person(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS organization (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS org_member (
  org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  person_id uuid NOT NULL REFERENCES person(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner','admin')),
  PRIMARY KEY (org_id, person_id)
);
CREATE TABLE IF NOT EXISTS event (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  edition text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  format text NOT NULL DEFAULT 'presencial' CHECK (format IN ('presencial','online','hibrido')),
  location text NOT NULL DEFAULT '',
  starts_on date,
  ends_on date,
  primary_color text NOT NULL DEFAULT '#0B2545',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  cloned_from uuid REFERENCES event(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, slug)
);
CREATE TABLE IF NOT EXISTS call (
  event_id uuid PRIMARY KEY REFERENCES event(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  opens_at timestamptz NOT NULL,
  closes_at timestamptz NOT NULL,
  review_due_at timestamptz,
  review_mode text NOT NULL DEFAULT 'double' CHECK (review_mode IN ('single','double')),
  reviews_per_submission int NOT NULL DEFAULT 2 CHECK (reviews_per_submission BETWEEN 1 AND 5),
  max_per_author int NOT NULL DEFAULT 3,
  max_pages int NOT NULL DEFAULT 10,
  max_mb int NOT NULL DEFAULT 10,
  same_institution_conflict boolean NOT NULL DEFAULT true,
  guidelines text NOT NULL DEFAULT '',
  results_released_at timestamptz
);
CREATE TABLE IF NOT EXISTS track (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES event(id) ON DELETE CASCADE,
  name text NOT NULL,
  position int NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS submission_type (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES event(id) ON DELETE CASCADE,
  name text NOT NULL,
  position int NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS review_criterion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES event(id) ON DELETE CASCADE,
  name text NOT NULL,
  max_score int NOT NULL DEFAULT 5,
  position int NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS submission (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES event(id) ON DELETE CASCADE,
  code text NOT NULL,
  track_id uuid NOT NULL REFERENCES track(id),
  type_id uuid NOT NULL REFERENCES submission_type(id),
  title text NOT NULL,
  abstract text NOT NULL,
  keywords text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN
    ('submitted','under_review','accepted','accepted_with_corrections','corrected','rejected','withdrawn')),
  submitter_id uuid NOT NULL REFERENCES person(id),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, code)
);
CREATE TABLE IF NOT EXISTS submission_author (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES submission(id) ON DELETE CASCADE,
  position int NOT NULL,
  person_id uuid REFERENCES person(id),
  name text NOT NULL,
  email text NOT NULL,
  affiliation text NOT NULL DEFAULT '',
  is_corresponding boolean NOT NULL DEFAULT false
);
CREATE TABLE IF NOT EXISTS submission_file (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  submission_id uuid NOT NULL REFERENCES submission(id) ON DELETE CASCADE,
  version int NOT NULL,
  reason text NOT NULL DEFAULT 'initial' CHECK (reason IN ('initial','correction')),
  storage_key text NOT NULL,
  bytes int NOT NULL,
  pages int NOT NULL,
  sha256 text NOT NULL,
  check_report jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (submission_id, version)
);
CREATE TABLE IF NOT EXISTS reviewer (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES event(id) ON DELETE CASCADE,
  person_id uuid NOT NULL REFERENCES person(id),
  status text NOT NULL DEFAULT 'invited' CHECK (status IN ('invited','accepted','declined')),
  max_load int NOT NULL DEFAULT 5,
  invited_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, person_id)
);
CREATE TABLE IF NOT EXISTS reviewer_track (
  reviewer_id uuid NOT NULL REFERENCES reviewer(id) ON DELETE CASCADE,
  track_id uuid NOT NULL REFERENCES track(id) ON DELETE CASCADE,
  PRIMARY KEY (reviewer_id, track_id)
);
CREATE TABLE IF NOT EXISTS conflict (
  submission_id uuid NOT NULL REFERENCES submission(id) ON DELETE CASCADE,
  person_id uuid NOT NULL REFERENCES person(id),
  source text NOT NULL CHECK (source IN ('declared','manual')),
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (submission_id, person_id)
);
CREATE TABLE IF NOT EXISTS assignment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES submission(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES reviewer(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','done','declined_conflict')),
  due_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (submission_id, reviewer_id)
);
CREATE TABLE IF NOT EXISTS review (
  assignment_id uuid PRIMARY KEY REFERENCES assignment(id) ON DELETE CASCADE,
  recommendation text NOT NULL CHECK (recommendation IN ('accept','accept_with_corrections','reject')),
  comment_author text NOT NULL DEFAULT '',
  comment_committee text NOT NULL DEFAULT '',
  submitted_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS review_score (
  assignment_id uuid NOT NULL REFERENCES assignment(id) ON DELETE CASCADE,
  criterion_id uuid NOT NULL REFERENCES review_criterion(id) ON DELETE CASCADE,
  score int NOT NULL,
  PRIMARY KEY (assignment_id, criterion_id)
);
CREATE TABLE IF NOT EXISTS decision (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES submission(id) ON DELETE CASCADE,
  outcome text NOT NULL CHECK (outcome IN ('accepted','accepted_with_corrections','rejected')),
  note_to_author text NOT NULL DEFAULT '',
  decided_by uuid NOT NULL REFERENCES person(id),
  decided_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS certificate (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES event(id) ON DELETE CASCADE,
  person_email text NOT NULL,
  person_name text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('author','reviewer')),
  subject text NOT NULL DEFAULT '',
  code text NOT NULL UNIQUE,
  issued_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, person_email, kind, subject)
);
CREATE TABLE IF NOT EXISTS email_message (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid,
  to_email text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS audit_log (
  id bigserial PRIMARY KEY,
  org_id uuid,
  actor_id uuid,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS submission_event_idx ON submission(event_id, status);
CREATE INDEX IF NOT EXISTS author_email_idx ON submission_author(lower(email));
CREATE INDEX IF NOT EXISTS assignment_reviewer_idx ON assignment(reviewer_id, status);
