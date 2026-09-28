# Punkt-o-Mat — Dev Log

Append-only. One entry per work session, newest at the bottom. Never edit or delete a past entry — correct forward in a new one.

## 2026-09-27 — Spec, plan, and mockups finalized; no code yet

**What was built or changed:**
- spec.md v1 written and agreed: formula/rounding rule, Firestore data model, screen list, stack decision.
- Decisions resolved: weekly bonus = 20 pts/week, automatic overflow once the daily 30 is exceeded, Monday–Sunday, no rollover; Sporttag/XX-Tag flags from the old sheet dropped; sections auto-suggested by time of day (overridable); visual style deferred to match Haushaltsbuch's look.
- PLAN.md written: 8 phases (Infrastructure → Datenbank → Hinzufügen → Heute → Gewicht → Einstellungen → optional data migration → polish).
- Five mobile mockups published (Heute, Hinzufügen, Datenbank, Gewicht, Einstellungen) — visual reference only, not yet wired to real data or logic.
- This CLAUDE.md adapted from the Haushaltsbuch project's version.

**State of the build:** nothing implemented. No repo, no Firebase project, no code.

**Open items (non-blocking, for a natural checkpoint):** none yet — this is the design phase; nothing has hit a real ambiguity during implementation because implementation hasn't started.

**Next session should:** start PLAN.md Phase 0 — create the GitHub repo, scaffold React/Vite/Tailwind, set up the Firebase project (Auth restricted to Markus's Google account, Firestore, hosting target), and confirm a working deploy pipeline before writing any feature code. Walk Markus through each infrastructure step per this file's "Infrastructure setup" section — don't assume he's done this before.

## 2026-09-28 — Spec audit (v1.1); infrastructure partly created by Markus

**What was changed (design phase, pre-Phase 0):**
- Full audit of spec.md against PLAN.md, CLAUDE.md and the five mockups. spec.md rewritten as v1.1; PLAN.md and CLAUDE.md updated to match. BUILD_LOG.md deleted — it duplicated this file (leftover naming from the Haushaltsbuch project).
- New decisions from Markus (recorded in spec.md §8): sport earns points back; sport logged via a Lebensmittel/Sport toggle on Hinzufügen; quantity in 0.5 steps plus free grams; week start fixed Monday.
- Gaps closed in the spec: exact rounding (ties up, float-safe) with worked example; weekly overflow algorithm (computed live, not stored); per-day settings snapshot; food/sport snapshots in log entries; entry IDs; local-date document IDs; time-of-day ranges; tracker decrement and seeding with fixed IDs; login / "Kein Zugriff" screen; weight stats per range; German number formats; GitHub Pages deployment details (`base`, authorized domain, no router); email-based security rules; design tokens; validation rules; mockup-vs-spec precedence.
- Mockups should be committed to `docs/mockups/` as heute.pdf, hinzufuegen.pdf, datenbank.pdf, gewicht.pdf, einstellungen.pdf.

**State of the infrastructure (per Markus, not yet verified):** GitHub repo `Punkt-O-Mat` exists; GitHub Pages source = GitHub Actions; Firebase project `punkt-o-mat` exists. Unknown: whether Firestore database is created and in which region, whether Google sign-in is enabled, whether a web app is registered. No code yet.

**Open items (non-blocking):**
- Phase 6: structure of the old Excel catalog (are nutrients per 100 g or per portion? are there recipes like Bananenshake with only totals?). Needs the file from Markus before Phase 6 starts.
- Time-of-day ranges (spec §4.2) and tracker "−" button (§4.1) are sensible defaults — Markus may want to adjust once he uses the app.

**Next session should:** start Phase 0 by collecting Markus's GitHub username and Google email, then verify (not redo) the repo, Pages and Firebase project, and walk him through the remaining console steps one at a time.

## 2026-09-28 — Phase 0: app live on GitHub Pages, sign-in and database working

**What was built or changed (PLAN.md Phase 0):**
- Repo populated on `main` (docs, mockups in `docs/mockups/`). Work happens on `main` only (Markus's decision); GitHub default branch switched to `main`.
- App icon chosen (option 07, apple) and exported to `public/` (favicon.svg, 192/512 PNG, maskable 512, apple-touch-icon). PLAN.md Phase 0 gained an icon item.
- Firebase turned out to be a **shared** project `exercise-tracker` (id `exercise-tracker-26120`) that also serves Markus's other PWAs. Punkt-o-Mat uses its own named Firestore database `punkt-o-mat` (eur3) and its own registered web app. spec.md §2/§5/§6 and CLAUDE.md updated accordingly.
- Scaffold: React 19 + Vite 8 + Tailwind 4 (tokens in `src/index.css` `@theme`), Firebase 12 with persistent local cache, Anmeldung / Kein Zugriff screens, 5-tab shell with empty screens (Einstellungen has a temporary sign-out), first-launch seeding (`src/seed.js`), vite-plugin-pwa manifest, GitHub Actions deploy to Pages.
- Firestore rules from spec §6 published on the `punkt-o-mat` database. First attempt failed with "Speichern fehlgeschlagen" until the rules were published correctly; confirmed working by Markus afterwards.

**State:** live at https://beermarkus-tech.github.io/Punkt-O-Mat/. Markus signed in on his phone successfully and seeding no longer fails. Not yet confirmed: "Kein Zugriff" with another Google account, install to home screen. No feature screens yet.

**Open items (non-blocking, awaiting Markus):**
- The old branch `claude/upload-mockups-repo-fq1kc4` could not be deleted from the session (push-delete not accepted); Markus can delete it in the GitHub UI.
- Outside this project: an unauthenticated REST read against the shared project's `(default)` database was not refused (returned 404 "not found" rather than 403), suggesting the other apps' rules allow public access. Told Markus; nothing changed there.
- Phase 6 Excel structure and the §4.1/§4.2 defaults from the previous entry remain open.

**Next session should:** get Markus's confirmation of the remaining Phase 0 checks (other account → Kein Zugriff; add to home screen shows the apple icon), then start Phase 1 (Datenbank).

## 2026-09-28 — Phases 1–3: Datenbank, Hinzufügen, Heute

**What was built or changed:**
- Phase 1 (Datenbank): foods/sports/trackers CRUD with validation, search, letter grouping, tracker ordering and icon/colour pickers. Confirmed working by Markus on his phone.
- Markus's decisions during Phase 1 (recorded in spec.md §8): reference value in lists shown rounded to 0.5 (display only); Kategorie picked from a dropdown of existing categories or created on the fly; a small "Build {n}" label on screen = GitHub Actions run number, and Claude tells Markus the build number after every push (CLAUDE.md).
- Phase 2 (Hinzufügen): food search with category chips, bottom sheet (unit chips + free grams, 0.5-step quantity, Rubrik by time of day, live points), "neu anlegen" shortcut, sport mode; writes to `dailyLogs/{Paris date}` with snapshots and the per-day settings snapshot. Confirmed by Markus (Build 6). Rubrik chips are a 2×2 grid instead of the mockup's single row (didn't fit on a phone).
- Phase 3 (Heute): summary card with live weekly-bonus overflow (`src/lib/week.js`), five collapsible sections, entry edit/delete via the Hinzufügen sheets (points from the entry's own snapshot), tracker cards (+/−, segmented or continuous bar), weight input, date navigation (arrows, native date picker, "Heute" chip). Selected date is shared with Hinzufügen. The temporary "Einträge des Tages" list on Hinzufügen was removed as planned (Markus was unsure it's needed anyway).
- Unit tests (Vitest, 36): roundHalf, food/sport points incl. the spec's Brezel example, Paris dates around midnight/DST, time-of-day ranges, labels, and the weekly overflow walk (pool runs out, earlier-day edit re-flows, per-day snapshots).

**State:** Phase 3 pushed but not yet confirmed by Markus on his phone.

**Open items (non-blocking, awaiting Markus):**
- Whether Hinzufügen should show a short "just added" list after all (he said "to be decided later").
- Carried over: old branch deletion, `(default)` database rules of the other apps, Phase 6 Excel structure, §4.1/§4.2 defaults.

**Next session should:** get Markus's confirmation of Heute (Phase 3), then Phase 4 (Gewicht).
