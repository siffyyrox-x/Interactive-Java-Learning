# CSE110 — Interactive Java Learning Lab

A static, browser-based Java learning environment that takes a complete beginner from
first principles to examination-style problem solving. No backend, no database, no
account, no API key, no remote compiler.

**Learning path:** Understand → Watch → Predict → Trace → Fix → Solve → Exam.

---

## Deploy to GitHub Pages

1. Create a new GitHub repository and push this project to the `main` branch.
2. Open **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Push to `main` (or run the *Deploy to GitHub Pages* workflow manually from the
   **Actions** tab). The workflow installs dependencies, runs the integrity tests,
   builds the site, and publishes it.
4. Open the URL the workflow prints in its **deploy** step.

That is the whole process. No backend, secrets, environment variables, or external
services are involved.

The site works from a user site (`username.github.io`) and from a project sub-path
(`username.github.io/repository-name`) without any configuration change, because
`vite.config.ts` uses a relative base (`base: './'`) and navigation is hash-based.

### If a deployment fails

| Symptom in the Actions log | Cause | Fix |
| --- | --- | --- |
| `Dependencies lock file is not found` | `package-lock.json` was not committed | Commit it — it is required by the `cache: npm` setting and by `npm ci` |
| `npm ci can only install with an existing package-lock.json` | same as above | same as above |
| `error TS…` during **Build static site** | a TypeScript error | `npm run build` locally and fix what it prints; the build intentionally fails on type errors |
| `Get Pages site failed … Not Found` on **Configure Pages** | Pages has never been enabled on the repository | Settings → Pages → Source → **GitHub Actions**, then re-run the job |
| `Resource not accessible by integration` | the workflow lacks Pages permissions, or Actions is read-only | Keep the `permissions:` block in `deploy.yml`, and set Settings → Actions → General → Workflow permissions to **Read and write** |
| Pages settings page offers no GitHub Actions source | the repository is private on a Free plan | Make the repository public, or upgrade — Pages for private repositories needs a paid plan |
| Page loads blank with 404s on `/assets/…` | an absolute base path | keep `base: './'` in `vite.config.ts` |

---

## What is included

- **15 topic lessons** covering the whole syllabus in order — Flowcharts, Variables, Operators,
  Input, Conditions, Loops, Nested Loops, Digit Processing, Tracing (midterm) and Strings, Arrays,
  Building Arrays, Sorting, Methods, Recursion (final). Every lesson is split into short sections,
  and every section has its own interactive visual: shape explorer, cast lab, expression stepper,
  Scanner buffer simulator, branch explorer, truth tables, nested-loop grid, digit peeler,
  merge-checksum animator, String lab, `==` vs `equals` memory diagram, array reference diagram,
  two-index array builder, selection/bubble sort animation and a recursion call stack.
- **Predict-the-output** exercises and quizzes in every lesson, checked by the same interpreter.
- **149 long-form exam-style practice problems**: flowchart → Java, digit checksums, trace tables
  (marked cell by cell), exact-output tracing, condition/loop scenarios, String processing, array
  building, sorting, methods and recursion tracing. Code answers run against hidden tests.
- **Execution visualizer**: a real Java-subset interpreter that runs in the browser and records
  every step — variables with old → new values, output, the input buffer, arrays, String
  characters, loop iterations, a live trace table, the call stack and the recursion call tree.
- **Mock papers**: six midterm sets, four final sets, random papers and topic drills, timed or
  untimed, with partial marks and a replay of every model answer.
- **Lab**: write any program, run it with input, or step through it.
- **Progress** in `localStorage` only, with export/import and reset.
- Dark theme by default with a light toggle; self-hosted fonts; no external requests.

## How answers are checked

- **Programs** are run against the sample inputs and hidden test inputs. The expected output is
  whatever the reference solution prints. Input prompts are tolerated; wording and values must match.
- **Exam restrictions** (for example "no Strings or arrays") are checked on the syntax tree.
- **Trace tables** are compared cell by cell and line by line.

## Run locally

```bash
npm install
npm test        # integrity tests (also run by the deploy workflow)
npm run dev     # development server
npm run build   # production build into dist/
```

### Optional: verify against a real JDK

```bash
npm run verify:java
```

Compares the interpreter with `javac`/`java` on the test programs, every problem's reference
solution on every input, and every program the lessons run. Development tool only — the
published site never needs Java.

## Project structure

```
src/
  engine/java/  lexer, parser, type checker and tracing interpreter
  content/      topics, problem bank, mock papers
  lessons/      the 15 lessons and their interactive widgets
  components/   visualizer, flowchart, trace table, editor, problem view
  pages/        home, learn, practice, lab, exam prep, mock papers, progress
  lib/          routing, progress storage, grading
scripts/        integrity tests and JDK verification
.github/        GitHub Pages deployment workflow
```

## Progress data

Progress is saved only in the learner's own browser. Clearing site data, a private window, or
another browser or device separates it — use Export/Import on the Progress page to move it.

## Content identity

The site uses only the neutral identity **CSE110 — Interactive Java Learning Lab**. It
carries no institutional branding, no source-document references, and makes no claim
that any question is an official examination question. Practice material is labelled
*Practice*, *Exam-style* and *Challenge*.

## Credit

Created and developed by **Sifat Sadakin**
FYAT Mentor & Undergraduate Teaching Assistant at OAA (Office of Academic Advising)
LinkedIn — https://www.linkedin.com/in/sifat-sadakin-815b82243/
