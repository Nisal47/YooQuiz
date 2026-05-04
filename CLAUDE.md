# CLAUDE.md — YooQuiz

Real-time interactive classroom quiz app (Kahoot-style).
Deployed at: https://Nisal47.github.io/YooQuiz

---

## Commands

```bash
npm run dev        # local dev server → http://localhost:5173/YooQuiz/
npm run build      # production build → dist/
npm run deploy     # build + push to gh-pages branch (GitHub Pages)
```

Always use `cmd` to run npm commands on this machine (PowerShell blocks .ps1 scripts).

---

## Architecture

**No backend server.** Everything is Firebase Realtime Database + anonymous auth.

### Tech stack
| Concern | Library |
|---|---|
| UI | React 18 + Vite |
| Styling | Tailwind CSS (custom dark-futuristic theme) |
| Database | Firebase Realtime Database v9 |
| Auth | Firebase Anonymous Auth |
| Charts | Recharts |
| Routing | react-router-dom v6 — **HashRouter only** (required for GitHub Pages) |
| QR codes | qrcode.react |
| CSV parsing | PapaParse |
| Deploy | gh-pages |

### Route structure
```
/#/               YooQuizHome  (hub — choose module)
/#/quiz           LandingPage  (QuizBlast landing)
/#/quiz/host      HostPage     (wrapped in HostGate PIN check)
/#/quiz/join      StudentPage
/#/teamvote       TeamVoteLanding
/#/teamvote/host  TeamVoteHostPage  (wrapped in HostGate)
/#/teamvote/join  TeamVoteStudentPage
```

---

## Firebase data model

```
/sessions/{sessionId}
  code: string              6-char uppercase alphanumeric join code
  hostId: string            Firebase anonymous auth uid of the teacher
  status: "waiting" | "active" | "ended"
  currentActivityId: string | null
  createdAt: timestamp

/activities/{activityId}
  sessionId: string
  type: "quiz" | "team_evaluation"
  status: "pending" | "active" | "closed"
  order: number
  startedAt: timestamp      set by server when teacher launches

  -- quiz fields --
  question: string
  options: string[]         2–4 options
  correctIndex: number
  timeLimit: number         seconds (10/20/30/60)

  -- team_evaluation fields --
  title: string
  currentTeamIndex: number  index into settings.teams; teacher advances this live
  settings: {
    scale: number           e.g. 5  (rating buttons render 1..scale)
    criteria: string[]      e.g. ["Clarity", "Design", "Content"]
    teams: [{ id, name }]
    allowVoteEdit: boolean  false = write-once (enforced by DB rules)
    showResultsLive: boolean
  }

/responses/{activityId}/{studentId}    (quiz only)
  value: number             chosen option index (-1 = no answer / expired)
  timeRemaining: number     seconds left when submitted (client-calculated)
  pointsEarned: number      pre-calculated by student client
  submittedAt: timestamp

/participants/{sessionId}/{studentId}
  nickname: string
  joinedAt: timestamp
  totalScore: number        updated atomically after each question reveal

/teamVotes/{activityId}/{teamId}/{studentId}   (team_evaluation only)
  ratings: { [criterion]: number }   e.g. { "Clarity": 4, "Design": 5 }
  totalScore: number                 sum of all criteria scores
  submittedAt: timestamp
```

### teamVotes write rules
- Write-once per `studentId` per `teamId` (`!data.exists()`)
- Students submit one vote per team; no editing after submit
- Teacher reads all votes under `/teamVotes/{activityId}` for results dashboard
- `allowVoteEdit: false` in settings is a UI hint; DB rules enforce write-once regardless

### Important: studentId ≠ Firebase auth uid
Students use a **tab-scoped random ID** (`p_xxx`) stored in `sessionStorage` via `src/utils/tabId.js`. This lets multiple students join from the same browser (testing). Firebase rules require only `auth != null` for participant/response writes — no uid matching.

---

## Scoring formula

```js
// Correct answer → 500–1000 pts based on speed
points = Math.round(500 + 500 * (timeRemaining / totalTime))

// Wrong answer or expired → 0 pts
// Maximum possible: 1000 pts/question × 20 questions = 20,000 pts
```

Scores are calculated **twice**: once client-side by the student (stored in response), then recalculated authoritatively by the teacher's client on reveal. The teacher's value is what gets written to `totalScore`.

---

## State machines

### Teacher (`HostPage.jsx`)
```
create → lobby → builder → controller → final
                 ↑_______↓
```
- `lobby`: session waiting, show join code + QR + participant list
- `builder`: add/edit/reorder/delete activities (MCQ + team_evaluation)
- `controller`: dispatches by `currentActivity.type`:
  - `type:'quiz'` → `QuestionController` (timer, live chart, reveal answer)
  - `type:'team_evaluation'` → `TeamEvalActivity` (controlling phase → results phase)
- A floating **Stop Session** button is visible in lobby/builder/controller — confirms then sets `session.status = 'ended'`

### Student (`StudentPage.jsx`)
```
join → waiting → question → answered → result → leaderboard ↺
                                                     ↓
                                                   final
```
- Two Firebase signals drive transitions (same for all activity types):
  1. `session.currentActivityId` changes → view = 'question'
  2. `activity.status` becomes `'closed'` → view = 'result' → leaderboard after 3.5s
- Render dispatch by `cachedActivity.type` at view='question' and view='result':
  - `quiz`: `QuestionScreen` / `ResultScreen`
  - `team_evaluation`: `TeamVotingCard` / `TeamEvalStudentResults`
- `cachedActivity` pattern: always keeps last non-null activity so child screens never receive null during Firebase round-trips
- For `team_evaluation`, `view='answered'` is never entered — `TeamVotingCard` manages its own per-team submission state
- When teacher calls `advanceTeam()`, `activity.currentTeamIndex` changes → `cachedActivity` updates → `TeamVotingCard` re-renders with new team (no view transition needed)

---

## Key files

### Firebase services (`src/firebase/`)
All Firebase calls live here. Components never import from `firebase/*` directly.

| File | Responsibility |
|---|---|
| `config.js` | App init, `ensureAuth()` for anonymous sign-in |
| `sessionService.js` | CRUD + realtime subscription for sessions; lookup by code |
| `activityService.js` | CRUD + `launchActivity` / `closeActivity` + `createTeamEvalActivity` |
| `responseService.js` | Write-once response submission, realtime subscription (quiz only) |
| `scoreService.js` | `addParticipant`, `incrementScore` (transaction), `applyRoundScores`, leaderboard subscription |
| `teamEvalService.js` | `submitTeamVote`, `hasVotedForTeam`, `onTeamVotesChange`, `onAllTeamVotesChange`, `advanceTeam` |

### Custom hooks (`src/hooks/`)
Thin wrappers over service subscriptions. Return live state; handle cleanup.

| Hook | Subscribes to |
|---|---|
| `useSession(sessionId)` | `/sessions/{sessionId}` |
| `useActivity(activityId)` | `/activities/{activityId}` |
| `useActivities(sessionId)` | `/activities` filtered by sessionId |
| `useResponses(activityId)` | `/responses/{activityId}` |
| `useLeaderboard(sessionId)` | `/participants/{sessionId}` sorted by totalScore |
| `useTeamVotes(activityId, teamId)` | `/teamVotes/{activityId}/{teamId}` (one team) |
| `useAllTeamVotes(activityId)` | `/teamVotes/{activityId}` (all teams, for results) |

### Pure utilities (`src/utils/`)
No side effects — safe to unit test.

| File | Purpose |
|---|---|
| `scoreCalc.js` | `calcPoints(isCorrect, timeRemaining, totalTime)` and `getTimeRemaining(startedAt, timeLimit)` |
| `csvParser.js` | `parseQuizCsv(papaParsedData)` → `{ valid[], rows[] }` with per-row validation errors; `buildCsvTemplate()` |
| `codeGenerator.js` | `generateUniqueCode()` — checks Firebase for collisions, returns a free 6-char code |
| `tabId.js` | `getParticipantId()` — stable random ID per browser tab via sessionStorage |
| `teamEvalScoring.js` | Pure functions: `calculateTeamScores`, `calculateCriteriaAverages`, `rankTeams`, `getBestTeamPerCriterion`, `countTotalVotes` |

### Auth gate (`src/components/shared/HostGate.jsx`)
Wraps `/#/host`. Checks `sessionStorage` for prior auth. PIN is set via `VITE_HOST_PIN` in `.env`. Falls back to `"admin"` if env var is missing.

---

## Environment variables

File: `.env` (gitignored — never commit)

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
VITE_HOST_PIN=
```

`VITE_HOST_PIN` — teacher-only PIN for the host gate. Set to anything you like.

---

## Firebase security rules

Current rules in `firebase.rules.json`. Must be **manually pasted** into Firebase Console → Realtime Database → Rules each time they change.

Key decisions:
- `sessions`: publicly readable (students need to look up by code), writable only by the creating host
- `activities`: publicly readable, writable by any authenticated user (teacher is authenticated)
- `responses`: readable by authenticated users, **write-once** (`!data.exists()`) by any authenticated user
- `participants`: publicly readable, writable by any authenticated user (covers tab-scoped IDs and teacher score updates)
- `teamVotes`: readable by authenticated users (teacher needs to read all votes for results), **write-once** per `{studentId}` per `{teamId}` — one vote per student per team, no editing

---

## CSV import format

```csv
question,option_a,option_b,option_c,option_d,correct,time_limit
"What is 2+2?","1","2","3","4","C","30"
```

- `correct`: A/B/C/D or 0/1/2/3 (case-insensitive)
- `option_c`, `option_d`, `time_limit`: optional
- Download template button available in Quiz Builder

---

## Deployment

```bash
# 1. Make sure .env is populated
# 2. Run:
npm run deploy
```

`predeploy` script runs `vite build` first, embedding env vars into the bundle.
The `gh-pages` package then force-pushes `dist/` to the `gh-pages` branch.

GitHub Pages settings: Source → Branch `gh-pages`, folder `/`.

Live URL: **https://Nisal47.github.io/YooQuiz**

---

## Common gotchas

- **HashRouter is mandatory** — BrowserRouter breaks on GitHub Pages (no server-side routing)
- **`vite.config.js` base must match repo name** — currently `/YooQuiz/`
- **Firebase rules must be applied in the Console** — editing `firebase.rules.json` locally has no effect until pasted into the Console
- **Anonymous auth must be enabled** in Firebase Console → Authentication → Sign-in method
- **`sessions` needs `.indexOn: ["code"]`** in rules for the join-by-code query to work
- **Multiple browser tabs** share the same Firebase anonymous auth uid — the `tabId.js` pattern resolves this for testing; in real classroom use each device has its own uid anyway
