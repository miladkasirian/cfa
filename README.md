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

### 2. Server mode: results saved on the server per user
The same front end (`docs/`) also runs inside a separate Node.js server with Google sign-in and a PostgreSQL database. When the page finds that server (it calls `/api/config`), it asks the user to sign in with Google and stores flags, the exam in progress and every finished attempt in the database, so a user sees the same results on any device. Without a server it stays in browser mode.

Server API used by the page: `GET /api/config`, `GET /api/me`, `POST /api/auth/google`, `POST /api/auth/logout`, `POST /api/auth/logout-all`, `GET /api/state`, `PUT /api/state` (favorites, hard flags, exam in progress), `POST /api/attempts` (one finished attempt), `DELETE /api/attempts` (clear history).

## Rebuilding the question bank
The questions live in `bank/*.json` (one file per two exams). After editing, validate and rebuild:
```
python3 tools/validate.py bank --build docs/data/bank.js
```
The validator checks the structure, that each question has exactly 3 options, and that the Persian text contains no Latin letters.

## Source
All rules come from the CFA Institute 2026 curriculum (Code of Ethics and Standards of Professional Conduct, Guidance for Standards I-VII, Application of the Code and Standards: Level III, Asset Manager Code). The cases are original practice material written for this app, not copies of CFA Institute questions.
