# Punkt-o-Mat — Build Plan

Staged phases, each with a concrete deliverable Markus can test on his phone. Revised only when the plan itself changes (a phase reordered, split, or rescoped) — not appended to every session. Section references (§) point to spec.md.

## Phase 0 — Infrastructure
**Already done by Markus (2026-09-28):** GitHub repo `Punkt-O-Mat` created; GitHub Pages source set to "GitHub Actions"; Firebase project `punkt-o-mat` created. Verify each of these before relying on it.

**Deliverable:** the live GitHub Pages URL shows the Anmeldung screen. Markus can sign in with his Google account and sees an empty app shell with the 5-tab bottom nav. Any other Google account sees "Kein Zugriff". The app can be installed to the home screen.
- Collect from Markus: GitHub username, Google email, Firebase web-app config (walk him through registering a web app in the Firebase console)
- Scaffold React + Vite + Tailwind; `base: '/Punkt-O-Mat/'` (§5)
- GitHub Actions workflow: push to `main` → build → deploy to Pages
- Firebase: confirm Firestore exists (EU region), enable Google provider, add `{username}.github.io` to authorized domains (§5)
- Firestore rules from §6 pasted in the console; `ALLOWED_EMAIL` constant in the app
- Firestore offline persistence; PWA manifest + icons (§5)
- Design tokens from §7 set up in Tailwind config; bottom nav with lucide icons
- First-launch seeding: `settings/config` defaults + the two trackers (§2)

## Phase 1 — Datenbank (foods, sports, trackers)
**Deliverable:** Markus can add, edit, delete a food (per-100 g kcal/fat and multiple named units), a sport (points/30 min) and a tracker — all persisted and visible after reload. (§4.3)
- Foods CRUD + units sub-list, validation, letter grouping, search
- Sports CRUD
- Trackers CRUD incl. icon/color pickers and ordering

## Phase 2 — Hinzufügen (logging flow)
**Deliverable:** Markus can log a food (unit or free grams, 0.5-step quantity, live points preview, auto-suggested Rubrik) and a sport session, and — because Heute doesn't exist yet — sees them in a simple temporary list of the selected day's entries at the bottom of Hinzufügen (removed in Phase 3). (§1.1, §1.3, §4.2)
- `roundHalf` + points functions, with unit tests covering the worked example in §1.1
- Lebensmittel mode: search, category chips, bottom sheet, time-of-day Rubrik
- "„…“ neu anlegen" shortcut to the food form
- Sport mode
- Writes into `dailyLogs/{date}` with snapshots and per-day settings snapshot (§2), local-date IDs

## Phase 3 — Heute (dashboard)
**Deliverable:** the full daily view — summary card (Verbleibend / Maximum / Verbraucht / Wochenbonus), five sections with entry edit/delete, tracker cards, weight input, date navigation. (§1.4, §4.1)
- Weekly overflow computation per §1.4, with unit tests (incl. a week where the pool runs out, and editing an earlier day)
- Sections + edit sheet (reuse the Phase 2 sheet)
- Tracker +/− and weight input
- Date navigator + "Zu Datum" picker + "Heute" chip

## Phase 4 — Gewicht
**Deliverable:** weight chart with 2W/1M/3M/Alles toggle and range-based stats; "Gewicht eintragen" writes today's weight. (§4.4)

## Phase 5 — Einstellungen
**Deliverable:** daily allowance and weekly bonus editable (today + future only), account info, version, sign-out. (§4.5)

## Phase 6 — Data migration (optional, as time allows)
**Deliverable:** the old Excel food/sport catalog (and, if wanted, weight history) imported into Firestore. Needs Markus's Excel file and a decision on how its columns map to §2 — see DEVLOG open items.

## Phase 7 — Polish
- Recent/favorites quick-add on Hinzufügen
- Weekly/monthly rollup stats
- Any deferred items surfaced in DEVLOG.md
