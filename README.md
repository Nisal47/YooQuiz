# QuizBlast 🎮

Real-time interactive classroom quiz system built with React + Firebase Realtime Database — no server required.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS (dark futuristic theme) |
| Backend | Firebase Realtime Database + Anonymous Auth |
| Charts | Recharts |
| Routing | react-router-dom (HashRouter) |
| QR codes | qrcode.react |
| CSV parsing | PapaParse |
| Deployment | gh-pages → GitHub Pages |

---

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/your-username/quiz-app
cd quiz-app
npm install
```

### 2. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com) → **Add project**
2. Enable **Realtime Database**:
   - Rules → paste contents of `firebase.rules.json`
   - Add `.indexOn: ["code"]` to the sessions node (already in the rules file)
3. Enable **Authentication** → Sign-in method → **Anonymous** → Enable
4. Go to **Project Settings** → **Your apps** → **Web** → copy config values

### 3. Configure Environment

```bash
cp .env.example .env
```

Fill in `.env` with your Firebase credentials:

```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_APP_ID=1:...
```

### 4. Run Locally

```bash
npm run dev
```

Open `http://localhost:5173` — teacher at `/host`, students at `/join`.

---

## Deploying to GitHub Pages

### 1. Update `vite.config.js`

```js
base: '/your-repo-name/',
```

### 2. Update `package.json`

```json
"homepage": "https://your-username.github.io/your-repo-name"
```

### 3. Deploy

```bash
npm run deploy
```

This runs `vite build` then pushes `dist/` to the `gh-pages` branch.

> **Note:** Firebase credentials in `.env` are embedded at build time. They are safe to expose for client-side Firebase apps with proper Security Rules. Never commit `.env` to version control.

---

## Firebase Security Rules

Paste `firebase.rules.json` into your Realtime Database Rules tab:

```json
{
  "rules": {
    "sessions": {
      ".indexOn": ["code"],
      "$sessionId": {
        ".read": true,
        ".write": "auth != null && (!data.exists() || data.child('hostId').val() === auth.uid)"
      }
    },
    "activities":  { "$activityId": { ".read": true, ".write": "auth != null" } },
    "responses": {
      "$activityId": {
        ".read": "auth != null",
        "$studentId": { ".write": "auth != null && auth.uid === $studentId && !data.exists()" }
      }
    },
    "participants": {
      "$sessionId": {
        ".read": true,
        "$studentId": {
          ".write": "auth != null && (auth.uid === $studentId || root.child('sessions').child($sessionId).child('hostId').val() === auth.uid)"
        }
      }
    }
  }
}
```

---

## CSV Import Format

Download a blank template from the Quiz Builder → **Download Template** button.

### Format

```csv
question,option_a,option_b,option_c,option_d,correct,time_limit
"What is 2 + 2?","1","2","3","4","C","30"
"Capital of France?","Berlin","Paris","Rome","Madrid","B","20"
```

| Column | Required | Notes |
|---|---|---|
| `question` | ✅ | Question text |
| `option_a` | ✅ | First answer option |
| `option_b` | ✅ | Second answer option |
| `option_c` | ❌ | Optional third option |
| `option_d` | ❌ | Optional fourth option |
| `correct` | ✅ | `A`/`B`/`C`/`D` or `0`/`1`/`2`/`3` (case-insensitive) |
| `time_limit` | ❌ | Seconds — defaults to `30` if blank |

### Import Preview

After selecting a CSV file, a preview modal shows each row with:
- ✅ Valid rows: pre-selected checkboxes
- ❌ Invalid rows: specific error message, checkbox disabled
- Only selected valid rows are imported

---

## Scoring Formula

```js
// Correct answer: 500–1000 points based on speed
points = Math.round(500 + 500 * (timeRemaining / totalTime))

// Wrong answer or no answer: 0 points
```

- Answer instantly → **1000 pts**
- Answer on the last second → **500 pts**
- Wrong / no answer → **0 pts**

---

## How It Works

### Teacher Flow

```
/host → Create Session → Lobby (code + QR + participants)
     → Quiz Builder (add/edit/import questions)
     → Start Quiz → Question Controller
        → Launch question → students see it live
        → Live bar chart updates as answers come in
        → Reveal Answer → scores calculated & updated
        → Leaderboard → Next Question
     → End Quiz → Final Leaderboard
```

### Student Flow

```
/join → Enter code + nickname → Waiting Room
     → Question (timer ring + 4 answer buttons)
     → "Answer locked in!" 
     → Result (correct/wrong, points earned, total)
     → Leaderboard (top 5, highlighted position)
     → repeat per question
     → Final screen (podium, rank, score)
```

---

## Project Structure

```
src/
  components/
    teacher/
      SessionLobby.jsx       Join code, QR code, participant list
      QuizBuilder.jsx        Question list + add/edit/import
      QuestionCard.jsx       Single question card with inline edit
      CsvImporter.jsx        File picker + PapaParse integration
      CsvPreviewModal.jsx    Per-row validation preview table
      QuestionController.jsx Launch, live chart, reveal, next
      LiveResultsChart.jsx   Recharts bar chart for responses
      Leaderboard.jsx        Shared leaderboard component
    student/
      JoinScreen.jsx         Code + nickname entry
      WaitingRoom.jsx        Pulsing waiting state
      QuestionScreen.jsx     Timer ring + answer buttons
      ResultScreen.jsx       Correct/wrong + score popup
      LeaderboardScreen.jsx  Top 5 mid-game leaderboard
      FinalScreen.jsx        Podium + final rank
    shared/
      Timer.jsx              SVG countdown ring
      Modal.jsx              Generic modal overlay
      ScorePop.jsx           Floating score animation
      ParticipantCount.jsx   Live count pill
  hooks/
    useSession.js            Firebase session subscription
    useActivity.js           Firebase activity subscription(s)
    useResponses.js          Firebase responses subscription
    useLeaderboard.js        Firebase participants subscription
  firebase/
    config.js                Firebase init + ensureAuth()
    sessionService.js        Session CRUD + queries
    activityService.js       Activity CRUD + launch/close
    responseService.js       Response submission + subscription
    scoreService.js          Score increment + leaderboard
  utils/
    csvParser.js             Pure: PapaParse → validated questions
    scoreCalc.js             Pure: speed-bonus point formula
    codeGenerator.js         6-char unique code generator
  pages/
    LandingPage.jsx          Home screen
    HostPage.jsx             Teacher state machine
    StudentPage.jsx          Student state machine
  styles/
    theme.css                Tailwind + custom animations
  App.jsx                    HashRouter + routes
  main.jsx                   React root
```

---

## License

MIT
