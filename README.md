# CFA Level III Ethics Practice

A practice and testing web app for the **Ethical and Professional Standards** topic of the CFA Level III exam, built from the official 2026 curriculum (Level III Core, Volume 5).

- 30 practice exams in the Level III item-set format: each exam has 3 case vignettes with 4 questions each, and every question has 3 options.
- Every question has a "Show answer" button with a plain-language explanation of why the answer is right and why the others are wrong, plus the exact reference in the official curriculum (Standard, Guidance section, Application Example, Level III case, or Asset Manager Code section).
- English and Persian (switch at the top of the page). The Persian mode translates everything: cases, questions, options, explanations and references.
- Favorites, "mark hard", redo missed questions, practice by Standard, score history with a chart, accuracy by Standard (weakest first), and a question-by-question review of every finished exam.
- Works on phones and when zooming: text wraps inside its box.

## Two ways to run it

### 1. Static (GitHub Pages or any web host): results saved in the browser
The `docs/` folder is a complete static site. On GitHub Pages it is served from the `docs` folder of the `main` branch. Results are saved in the browser's local storage on that device. You can move them with "Export my data" / "Import data" on the Progress page.

### 2. Server mode (your VPS and domain): results saved on the server per user
`server/server.js` serves the same app and adds user accounts, so a user signs in from any device and sees the same results. It has no dependencies (Node.js 18 or newer).

```
cd server
node server.js            # http://127.0.0.1:8080
```

The page detects the server automatically (it calls `api/health`). If the server answers, the page asks the user to sign in and stores everything on the server; otherwise it stays in browser mode.

Settings (environment variables): `PORT`, `HOST`, `DATA_DIR`, `REGISTRATION` (`open`, `invite`, `closed`), `INVITE_CODE`, `COOKIE_SECURE=1` (when served over https), `SESSION_DAYS`.

Admin commands:
```
node server.js adduser <username> <password>
node server.js passwd  <username> <newpassword>
node server.js deluser <username>
node server.js listusers
```

Deployment details are in `DEPLOY.md`.

## Rebuilding the question bank
The questions live in `bank/*.json` (one file per two exams). After editing, validate and rebuild:
```
python3 tools/validate.py bank --build docs/data/bank.js
```
The validator checks the structure, that each question has exactly 3 options, and that the Persian text contains no Latin letters.

## Source
All rules come from the CFA Institute 2026 curriculum (Code of Ethics and Standards of Professional Conduct, Guidance for Standards I-VII, Application of the Code and Standards: Level III, Asset Manager Code). The cases are original practice material written for this app, not copies of CFA Institute questions.
