# Punkt-o-Mat — Spec (v1.1)

Personal Weight Watchers-style points tracker. Single user (Markus), Google sign-in only. Mobile-first, installable web app (PWA), German UI.

**How to read this document:** every section is authoritative. The mockups in `docs/mockups/` show layout and visual style only — **the numbers inside the mockups are illustrative and partly inconsistent; where a mockup and this spec disagree, this spec wins.**

---

## 1. Core formula & rounding

### 1.1 Food points
Base nutrient data is stored **per 100 g** for every food: `kcal_100`, `fat_100`.
Liquids are treated the same way: **1 ml = 1 g** (no density conversion).

For a logged entry of quantity `qty` × a unit weighing `unitGrams`:

```
raw_points    = qty * (unitGrams / 100) * (fat_100 / 9 + kcal_100 / 60)
logged_points = roundHalf(raw_points)
```

`roundHalf(x)` rounds to the nearest 0.5, ties rounding **up**, and must be protected against floating-point error:

```js
const roundHalf = (x) => Math.round((x + 1e-9) * 2) / 2;
```

- Rounding happens **exactly once, at the end**, after multiplying by quantity. Never round per unit and then multiply.
- Worked example: Brezel, `kcal_100 = 238`, `fat_100 = 3.6` → per-100 g value = 3.6/9 + 238/60 = 0.4 + 3.967 = 4.367. One "Klein" (70 g), qty 1 → 3.057 → **3**. Qty 2 → 6.113 → **6**. Qty 0.5 → 1.528 → **1.5**.

### 1.2 Reference value (display only)
Lists (Datenbank, Hinzufügen) show a reference value = `fat_100 / 9 + kcal_100 / 60` (points per 100 g), **rounded to the nearest 0.5 with `roundHalf` for display** (e.g. 4.367 → "4,5"). This rounding is visual only — the value is never stored and never used in any calculation; the real rounding happens once, when an entry is logged (§1.1).

### 1.3 Sport points
Each sport has `pointsPer30Min` (positive number). For a session of `minutes`:

```
sport_points = roundHalf(minutes / 30 * pointsPer30Min)      // positive number
```

Sport points are **earned**: they increase that day's budget (see 1.4).

### 1.4 Daily budget, weekly bonus pool
Per day:
```
foodTotal   = sum(entries[].points)                 // all food entries that day
sportTotal  = sum(sport[].points)                   // all sport entries that day
dayBudget   = dailyAllowance + sportTotal           // dailyAllowance from that day's snapshot (§2)
```

Weekly bonus pool: `weeklyBonus` points per week (default 20), separate from the daily allowance, **no rollover**, week = **Monday–Sunday, fixed** (not configurable). Unused daily points are lost; they do **not** flow into the weekly pool.

Spending from the pool is **automatic overflow**, processed day by day in chronological order Monday → Sunday:

```
poolLeft = weeklyBonus                          // weeklyBonus snapshot of that week (§2)
for each day Monday..Sunday (in order):
    overflow = max(0, foodTotal - dayBudget)
    fromPool = min(overflow, max(0, poolLeft))
    poolLeft = poolLeft - fromPool
    deficit  = overflow - fromPool               // what the pool could not cover
    Verbleibend(day) = (overflow > 0) ? -deficit : dayBudget - foodTotal
```

- `Verbleibend` is `≥ 0` as long as the pool can absorb the overflow; it only goes **negative** once the pool is empty. The pool itself never goes below 0 — the uncovered excess is shown once, as negative `Verbleibend` on the day it happened.
- Logging is never blocked.
- These values are **always computed live** from the week's logs — never stored. Editing an entry on Tuesday correctly re-flows Wednesday–Sunday.

### 1.5 Number display (German format)
- Points: comma decimal, no trailing ",0" → "3", "4,5", "15". Negative with a real minus sign "−".
- Reference values (§1.2): same format as points → "4,5", "6".
- Weight: always one decimal + "kg" → "102,0 kg".
- Dates: e.g. "So, 27. Sept."; header label "HEUTE" / "GESTERN" / "MORGEN" when applicable, otherwise the weekday.

---

## 2. Data model (Firestore)

All data lives in the **named Firestore database `punkt-o-mat`** (region `eur3`) inside the shared Firebase project `exercise-tracker`, which also hosts other, unrelated apps with their own databases. The app must connect to this database by name (`getFirestore(app, 'punkt-o-mat')` / `initializeFirestore(app, settings, 'punkt-o-mat')`), never to `(default)`. All collections are top-level. There is exactly one user. Every document ID that is a date uses the **local date in Europe/Paris**, format `yyyy-mm-dd`. **Never derive a date from `toISOString()`** (that is UTC and produces the wrong day around midnight).

```
foods/{foodId}                       // auto ID
  name: string                       // required, unique (case-insensitive)
  category: string                   // required; free text, autocompleted from existing categories
  remark: string | null              // free text, e.g. "400ml Milch, 1 Banane, 2 TL Zucker"
  kcal_100: number                   // ≥ 0
  fat_100: number                    // ≥ 0
  units: [                           // ≥ 1 item; first item is always the fixed default
    { label: "100 g", grams: 100 },  // default unit: always present, cannot be edited or deleted
    { label: "Becher", grams: 150 }, // labels WITHOUT a leading count ("Klein", not "1 Klein")
    { label: "Klein", grams: 70 }
  ]
  createdAt, updatedAt: timestamp
  // Recipes only (§4.6) — a recipe is a food doc with type "recipe":
  type: "recipe" | absent            // absent = plain food
  servings: number                   // integer ≥ 1 ("Ergibt … Portionen")
  ingredients: [                     // ≥ 1 item, plain foods only (no recipes inside recipes)
    { foodId, foodName, kcal_100, fat_100,   // snapshot at recipe save time (fallback if the food is deleted)
      unitLabel, unitGrams, qty }            // same shape as a log entry's amount; "g" = free grams
  ]
  // A recipe doc has NO own kcal_100 / fat_100 / units: they are derived live (§4.6).

sports/{sportId}                     // auto ID
  name: string                       // required, unique
  pointsPer30Min: number             // > 0, steps of 0.5

trackers/{trackerId}                 // generic daily counters
  name: string                       // "Wasser", "Obst & Gemüse", later e.g. "Magnesium"
  unit: string                       // plural display unit: "Gläser", "Portionen", "mg"
  dailyTarget: number                // > 0
  step: number                       // increment per tap, default 1
  icon: string                       // one of the fixed icon keys in §7.3
  color: string                      // one of the fixed color keys in §7.3
  order: number                      // display order on Heute

dailyLogs/{yyyy-mm-dd}
  entries: [
    { id: string,                    // client-generated UUID (crypto.randomUUID())
      section: "morgens" | "mittags" | "abends" | "zwischendurch",
      foodId: string,
      foodName: string,              // snapshot at log time
      kcal_100: number,              // snapshot at log time
      fat_100: number,               // snapshot at log time
      unitLabel: string,             // e.g. "Klein", "100 g", or "g" for free grams
      unitGrams: number,             // grams per unit (1 for free grams)
      qty: number,                   // e.g. 1, 1.5, or 35 (free grams)
      points: number,                // logged_points (§1.1)
      loggedAt: timestamp }
    // Free entry ("Frei", §4.2) — no catalog food behind it:
    // { id, type: "quick", section, foodName /* the title */, kcal, fat /* totals */, points, loggedAt }
  ]
  sport: [
    { id: string, sportId: string,
      sportName: string,             // snapshot
      pointsPer30Min: number,        // snapshot
      minutes: number,
      points: number,                // POSITIVE earned points (§1.3)
      loggedAt: timestamp }
  ]
  trackerValues: { [trackerId]: number }   // keyed by the tracker's document ID
  weight: number | null              // kg, one decimal
  dailyAllowance: number             // snapshot of settings.dailyAllowance (see below)
  weeklyBonus: number                // snapshot of settings.weeklyBonus (see below)

settings/config
  dailyAllowance: number             // default 30
  weeklyBonus: number                // default 20
```

**Snapshots — why and how.** Log entries copy the food's name and nutrients so that later editing or deleting a food never changes or breaks past days. Past points are frozen; editing a food in Datenbank does **not** recompute old entries.

`dailyAllowance` / `weeklyBonus` are copied from `settings/config` the first time a `dailyLogs` doc is created. Changing a setting therefore affects **today and the future only**, never past days. When a setting is changed, also update today's doc (if it exists). For days with no doc, use the current settings. The weekly pool size for a week = the `weeklyBonus` of the **earliest existing** dailyLog in that week (else current settings).

**First launch:** if `settings/config` does not exist, create it with defaults. If `trackers` is empty, seed two trackers with **fixed IDs**:
- `wasser` — "Wasser", unit "Gläser", target 6, step 1, icon `droplet`, color `green`, order 1
- `obst-gemuese` — "Obst & Gemüse", unit "Portionen", target 5, step 1, icon `apple`, color `orange`, order 2

Deleting a tracker leaves old `trackerValues` keys in place; they are simply ignored.

---

## 3. App-wide behavior

- **Selected date.** The app holds one "selected date" (default: today). Heute shows it; the Hinzufügen panel writes to it. Switching tabs keeps it. Reopening the app resets it to today.
- **Navigation.** Five-tab bottom bar: Heute, Rechner, Datenbank, Gewicht, Einstellungen. Hinzufügen is not a tab: it opens as a full-screen panel (✕ to close) from a floating green "+" on Heute (same button as in Datenbank), or from Rechner. No URL router — tabs are React state (GitHub Pages has no server-side routing).
- **Loading & errors.** While data loads, show a simple spinner. If a write fails, show a short German toast ("Speichern fehlgeschlagen") — no silent failures.
- **Offline.** Firestore offline persistence is enabled; logging works without signal and syncs later.
- **Build number.** "Build {n}" is shown only in Einstellungen → Über, next to the version (e.g. "v0.1.0 · Build 19"). `n` is the GitHub Actions run number of the deploy, so it increases with every push to `main`.
- **Confirmation.** Every delete asks "Wirklich löschen?" (Abbrechen / Löschen).

---

## 4. Screens

### 4.0 Anmeldung
- Shown when signed out: app name, button "Mit Google anmelden" (`signInWithPopup`).
- Signed in with any account other than Markus's → screen "Kein Zugriff" with the account email and an "Abmelden" button. No data is read.

### 4.1 Heute (dashboard) — mockup `heute.pdf`
- **Header:** ◀ / ▶ arrows move one day; the date label in the middle opens a native date picker ("Zu Datum"). When the selected date is not today, a small "Heute" chip appears to jump back. Future dates allowed.
- **Summary card (green):** big "VERBLEIBEND {n} Pkt." (per §1.4; negative shown in orange). Right side: "Maximum" = `dayBudget` (with small subtext "30 + 3 Sport" when sport > 0) and "Verbraucht" = `foodTotal`. Footer row: "Wochenbonus {poolLeft} / {weeklyBonus} übrig", where `poolLeft` is the pool remaining **after the selected day** in the §1.4 walk.
- **Five sections:** Morgens, Mittags, Abends, Zwischendurch, Aktivität. Header shows name + section total ("15 Pkt."; Aktivität shows "−3 Pkt."). Non-zero totals and entry points are bold green in every section, zero stays muted. All collapsed on load; tapping a header toggles it; several may be open. Expanded rows: "{qty} {unitLabel} {foodName}" and points (e.g. "1 Klein Brezel oder Laugenstange   3"; free grams: "35 g Brezel …"; if unitLabel starts with a digit use "2 × 100 g …"). Aktivität rows: "{minutes} Min {sportName}   −{points}".
- **Editing an entry:** tap a row → the same bottom sheet as Hinzufügen (§4.2), prefilled, with "Speichern" and "Löschen". Points are recomputed from the entry's own snapshot (§2), not from the current food.
- **Tracker cards:** one card per tracker, sorted by `order`, two per row. Shows icon, name, progress, "{value} / {target} {unit}". Tap the card → +`step`. A small "−" button on the card → −`step` (min 0). Values above target are allowed ("7 / 6"). Progress: segmented bar (one segment per step unit) when `target/step ≤ 10`, else a continuous bar.
- **Weight row:** "Gewicht heute" (or "Gewicht" on other dates). Tap → numeric input (one decimal, 30–300 kg). Empty input clears the value (`null`).

### 4.2 Hinzufügen — mockup `hinzufuegen.pdf` (layout of the lists and sheet; its tab position is obsolete)
- **Opened** from the "+" on Heute (or "Als freie Eingabe hinzufügen" in Rechner) as a full-screen panel with ✕. Logs to the selected date.
- **Title:** "Hinzufügen"; if the selected date isn't today, subtitle shows the date.
- **Toggle at top:** "Lebensmittel | Sport | Frei".

**Frei mode (free entry)**
- For food not in the Datenbank: Titel*, kcal gesamt*, Fett gesamt (g)* — **totals of what was eaten**, not per 100 g — and Rubrik (time-of-day suggestion). Live points = `roundHalf(fat/9 + kcal/60)`, rounded once like every logged entry. Button "Hinzufügen · {points} Pkt."; after adding, the panel closes (like every add).
- Saved only in that day's log (shape in §2), never in the Datenbank. On Heute the row shows the title and points; tapping it opens the same form with Speichern / Löschen.

**Lebensmittel mode**
- Search field: case-insensitive, accent-insensitive substring match on name ("brotchen" finds "Brötchen").
- Category chips: "Alle" + all distinct categories, alphabetical. Single select.
- Result list: alphabetical (German collation, `localeCompare(…, 'de')`). Each row: name, "{category} · {reference} Pkt / 100 g". Empty search shows all foods.
- No results → button "„{Suchtext}“ neu anlegen" opens the Datenbank food form prefilled with the name; after saving, return here with that food selected.
- Tapping a food opens a **bottom sheet**:
  - Name, category, live points preview (large, top right).
  - **Größe:** chips for each unit ("100 g", "1 Klein", "1 Mittel" …) plus a final chip **"Gramm"**. Horizontally scrollable if they don't fit. Default: first non-default unit if one exists, else "100 g".
  - **Menge:** for normal units, − / + stepper in **0.5 steps**, min 0.5, default 1. For "Gramm", a numeric field for whole grams (stored as `unitLabel "g"`, `unitGrams 1`, `qty = grams`).
  - **Rubrik:** chips Morgens / Mittags / Abends / Zwischendurch, pre-selected by time of day (below), freely changeable.
  - Button "Hinzufügen · {points} Pkt." → saves, shows toast "Hinzugefügt" and **closes the whole Hinzufügen panel**, back to Heute. The same applies to sport and Frei: every successful add closes the panel.
- **Time-of-day suggestion** (local time, applies whatever date is selected):
  - 04:00–10:59 → Morgens
  - 11:00–14:59 → Mittags
  - 15:00–17:29 → Zwischendurch
  - 17:30–21:59 → Abends
  - 22:00–03:59 → Zwischendurch

**Sport mode**
- List of sports (alphabetical) with "{pointsPer30Min} Pkt / 30 Min".
- Tap → bottom sheet: minutes field (default 30, − / + in 5-min steps, min 5), live preview "+{points} Pkt.", button "Hinzufügen · +{points} Pkt.". Saved into `dailyLogs.sport`, shown in the Aktivität section.

### 4.3 Datenbank — mockup `datenbank.pdf`
- Segmented control: Lebensmittel / Sport / Tracker. Floating "+" button adds a new item of the active type.
- **Lebensmittel list:** search field (same matching as §4.2), grouped by first letter (Ä/Ö/Ü sort with A/O/U), each row: name, subtitle = remark if present else "{category} · {n} Größen", reference value right-aligned. Tap → edit form.
- **Food form:** Name*, Kategorie* (dropdown of existing categories, alphabetical, plus "+ Neue Kategorie …" which switches to a text field; a typed name matching an existing category ignoring case uses the existing spelling), Bemerkung, kcal pro 100 g*, Fett pro 100 g*, units list (add / rename / change grams / delete; "100 g" row locked; every size row, including the locked "100 g", shows its exact points for one piece, one decimal, not rounded to 0.5, in one aligned column — display only). Validation: required fields, numbers ≥ 0, unit grams > 0, unit labels unique within the food, food name unique. Buttons: Speichern, Löschen (edit only).
- **Kategorien:** a "Kategorien" button next to the Lebensmittel search opens a full-screen list of all categories (alphabetical, with the number of foods, recipes included). Tapping one opens a sheet with its name; Speichern renames it on every food at once (toast "Umbenannt"). If the new name matches another existing category (ignoring case), the app asks „{Name}“ gibt es schon. {n} Lebensmittel dorthin verschieben? and merges into that category's spelling. Log entries don't store categories, so history is unaffected. There is no delete: a category disappears once no food uses it.
- **Sport list/form:** name*, Punkte pro 30 Min* (> 0, 0.5 steps).
- **Tracker list/form:** name*, Einheit*, Tagesziel*, Schritt (default 1), icon (picker from §7.3), color (picker from §7.3), order (via up/down arrows in the list).
- Deleting a food or sport never affects past logs (snapshots, §2).

### 4.7 Rechner (tab)
- Quick points calculator, nothing is saved. Fields **kcal**, **Fett (g)** and optional **Gramm**: empty → the values are used as entered; filled → kcal/fat are per 100 g and scaled to the grams.
- Result, big: exact points `fat/9 + kcal/60` (× grams/100), **one decimal, rounded** (same one-decimal rule as elsewhere, e.g. 4,37 → 4,4) — not rounded to 0.5.
- Button **"Als freie Eingabe hinzufügen"** opens the Hinzufügen panel in Frei mode with the (scaled) kcal and fat totals prefilled (one decimal).

### 4.6 Rezepte (recipes)
A recipe is a reusable combination of foods (e.g. "Frühstücksmüsli" = 100 g Griechischer Joghurt + 10 g Agavensirup + 40 g Cornflakes). It lives in the Lebensmittel list and behaves like any food everywhere else (search, categories, Hinzufügen, Heute, edit sheet).

- **Derived values, always live.** From the ingredients, using each ingredient's *current* food data (falling back to the ingredient's own snapshot if that food was deleted, and to its stored `unitGrams` if the unit no longer exists): total grams `G`, total kcal `K`, total fat `F`. The recipe then acts as a food with `kcal_100 = K / G × 100`, `fat_100 = F / G × 100` and two units: "100 g" and **"Portion"** = `G / servings` grams. Editing an ingredient food in Datenbank therefore changes the recipe immediately.
- **Rounding once.** "1 Portion" = `roundHalf((F/9 + K/60) / servings)` — the exact ingredient values summed, rounded once (§1.1), never the sum of rounded ingredient points.
- **Past entries never change.** Logging a recipe snapshots its derived `kcal_100` / `fat_100` and the Portion grams into the entry like any food (§2). Editing a logged entry on Heute keeps the entry's own `unitGrams` for its unit.
- **Datenbank:** the "+" on Lebensmittel asks "Lebensmittel" or "Rezept". Recipe rows (Datenbank and Hinzufügen) show a small "Rezept" label; in Datenbank the subtitle = remark if present else "{category} · {ingredient names}", and the points per Portion on the right. Hinzufügen shows recipes as "{category} · {n} Pkt / Portion".
- **Recipe form:** Name*, Kategorie* (same picker as foods), Bemerkung, Ergibt … Portionen (stepper, integer ≥ 1, default 1), Zutaten list ("+ Zutat hinzufügen" → search plain foods → same size/amount sheet as Hinzufügen without Rubrik, button "Übernehmen"; tap a row to change, bin to remove), total line "Gesamt {G} g · {points} Pkt." (plus "1 Portion = … Pkt." when servings > 1). Validation: name unique among all foods, category required, ≥ 1 ingredient. Buttons: Speichern, Löschen (edit only).
- Deleting a food that a recipe uses keeps the recipe working from the ingredient snapshot.

### 4.4 Gewicht — mockup `gewicht.pdf`
- **Stats row:** START / HEUTE / DELTA / MAX / MIN, all computed **over the selected range**: Start = earliest weight in range, Heute = most recent weight in range, Delta = Heute − Start (signed, "−4,0"), Max/Min over range. No data → "–".
- **Chart:** line chart with dots (Recharts), x-axis = real time scale (gaps between measurements stay proportional), y-axis auto-scaled with ~1 kg padding, 4 horizontal gridlines, German date ticks "18.11.".
- **Points chart below the weight chart** (same card, same time axis, never a second y-axis on the weight chart): stacked bars of eaten points, split into **within the day budget** (primary green), **from the weekly bonus** (light green) and **beyond the bonus** = negative Verbleibend (orange), computed with the same live week logic as Heute (§1.4). A dashed line marks the budget. Legend below the bars. Tapping a day in either chart shows that day in both (daily mode). **Daily bars** for 2 Wochen / 1 Monat (dashed line = daily allowance); **weekly bars** (Monday–Sunday totals, dashed line = 7 × daily allowance + weekly bonus) for 3 Monate / Alles. Days/weeks without logs show no bar.
- **Range toggle:** 2 Wochen / 1 Monat / 3 Monate / Alles, counted back from today. Default: 1 Monat. Scopes both charts and the stats row.
- **"Gewicht eintragen":** writes to **today's** dailyLog (not the selected date), same validation as §4.1.
- Data source: `weight` field of `dailyLogs` (query docs where `weight != null`).

### 4.5 Einstellungen — mockup `einstellungen.pdf`
- **Punktebudget:** "Tägliche Punkte" and "Wochenbonus" — tap the value → number input (integers, 1–100). Effect per §2 snapshot rule (today and future). **No "Wochenbeginn" row** — week start is fixed Monday (the mockup's row is obsolete).
- **Konto:** Google display name + avatar (initials fallback), "Google-Konto verbunden".
- **Über:** "Punkt-o-Mat" + version from `package.json`.
- **Abmelden** button (orange text).

---

## 5. Stack & deployment

- React + Vite + Tailwind CSS, Recharts (weight chart), lucide-react (icons), vite-plugin-pwa (installable, offline shell).
- Firebase JS SDK v10+: Auth (Google provider, `signInWithPopup`), Firestore with `persistentLocalCache`. **Firebase Hosting is not used.**
- **Hosting:** GitHub Pages, deployed by a GitHub Actions workflow on every push to `main` (build → upload `dist` → deploy). Repo: `Punkt-O-Mat`. Vite `base` must be `'/Punkt-O-Mat/'` (case-sensitive, matches the repo name). PWA manifest `start_url` and `scope` must use the same base.
- **Firebase config** (apiKey, projectId …) is committed in `src/firebase.js`. These values are public identifiers, not secrets; security comes from the Firestore rules (§6).
- **Firebase project:** the shared project `exercise-tracker` (not a dedicated one). Punkt-o-Mat gets its own registered web app and its own Firestore database `punkt-o-mat` (`eur3`). Auth (Google provider, authorized domains, user list) is **shared** with the other apps in the project: check it, but never change a shared setting in a way that affects them.
- **Firebase console setup:** database `punkt-o-mat` exists (done); Google sign-in provider enabled and `beermarkus-tech.github.io` in Auth → Settings → Authorized domains (likely already true, since the other apps use the same setup — verify).
- Built with Claude Code from an Android tablet; Markus is not a programmer (see CLAUDE.md).

## 6. Security

Single-user lock via Firestore rules, keyed on Markus's Google email (known up front, so no need to sign in first to find a UID):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null
        && request.auth.token.email == "beer.markus@gmail.com"
        && request.auth.token.email_verified == true;
    }
  }
}
```

The same email is a constant in the app (`ALLOWED_EMAIL`) to show the "Kein Zugriff" screen (§4.0). Rules are pasted into the Firebase console (Firestore → select database `punkt-o-mat` → Rules) — no Firebase CLI needed. Rules are per database, so these never affect the other apps' databases in the shared project. Allowed email (confirmed by Markus): `beer.markus@gmail.com`.

## 7. Visual design

### 7.1 Principles
Clean, light, rounded cards on an off-white background, one green primary color, orange for warnings/negative/destructive. Mobile-first (design width ~390 px); on wider screens the content is centered with max width 480 px. Light mode only in v1.

### 7.2 Tokens (approximated from the mockups)
| Token | Value | Use |
|---|---|---|
| primary | `#2E6F4E` | summary card, active chips, buttons, active tab |
| primary-soft | `#E3EFE7` | selected unit chip, value pills |
| accent | `#C2410C` | Obst & Gemüse, negative Verbleibend, Abmelden |
| bg | `#F8F7F4` | page background |
| card | `#FFFFFF`, border `#E7E5E0` | cards, list rows |
| text | `#1C1C1C` / muted `#6B7280` | |
| radius | 16 px cards, 12 px chips/buttons, full for category chips | |

### 7.3 Fixed choice lists
- Tracker icons (lucide-react): `droplet`, `apple`, `pill`, `coffee`, `footprints`, `moon`, `leaf`, `heart`.
- Tracker colors: `green` (= primary), `orange` (= accent), `blue #2563EB`, `purple #7C3AED`.
- Bottom nav icons: `house`, `plus`, `align-justify`, `activity`, `settings`.

## 8. Decisions log

- Weekly bonus: 20 pts/week, automatic overflow, Mon–Sun, no rollover. *(2026-09-27)*
- Sporttag/XX-Tag flags from the old sheet: not carried over. *(2026-09-27)*
- Section auto-suggestion by time of day: yes, overridable per entry. *(2026-09-27)*
- Visual style: defined by the mockups + §7 tokens (the Haushaltsbuch code is not available to this repo). *(2026-09-28)*
- Sport **earns** points back into that day's budget. *(2026-09-28)*
- Sport is logged via a "Lebensmittel | Sport" toggle on Hinzufügen. *(2026-09-28)*
- Quantity: 0.5 steps, plus a free "Gramm" option. *(2026-09-28)*
- Week start fixed Monday; not a setting. *(2026-09-28)*
- Hosting: GitHub Pages via GitHub Actions (not Firebase Hosting). *(2026-09-28)*
- Access lock by Google email instead of UID. *(2026-09-28)*
- Log entries store food/sport snapshots; weekly-bonus usage is computed, not stored (`weeklyBonusUsed` removed). *(2026-09-28)*
- Settings changes apply to today and future days only (per-day snapshot). *(2026-09-28)*
- Aktivität is not a food Rubrik; sport entries go there automatically. *(2026-09-28)*
- Allowed Google account: beer.markus@gmail.com. *(2026-09-28)*
- Firebase: shared project `exercise-tracker`, own named database `punkt-o-mat` (eur3); Auth is shared with Markus's other GitHub Pages apps. *(2026-09-28)*
- Reference value in lists is shown rounded to 0.5 (display only). *(2026-09-28)*
- Kategorie is picked from existing categories or created on the fly. *(2026-09-28)*
- Small build number visible on screen, increasing with every deploy. *(2026-09-28)*
- Recipes: a food of type "recipe" built from ingredients, values derived live from current ingredient foods, "Ergibt … Portionen" field; built as Phase 3b before Gewicht. *(2026-09-28)*
- Gewicht shows points too: a separate stacked-bar chart on the same time axis instead of a second y-axis (Claude pushed back on dual axes; Markus agreed). Weekly bars for ranges longer than one month. *(2026-09-28)*
- Food form shows exact (unrounded, one decimal) points next to every size, the "100 g" row included (replaces the separate "= … Pkt / 100 g" line). *(2026-09-28)*
- Heute: non-zero section totals and entry points bold green in all sections, like Aktivität. *(2026-09-29)*
- Build number only in Einstellungen, removed from all other screens. *(2026-09-29)*
- Hinzufügen moves behind a "+" on Heute; new "Frei" mode for arbitrary kcal/fat entries with a title (log only, not saved to Datenbank); new Rechner tab in its place (one decimal, rounded like everywhere else; optional grams; shortcut to Frei). Sport stays in the panel. *(2026-09-29)*
- Hinzufügen panel closes automatically after every add (food, sport, Frei). *(2026-09-29)*
- Categories can be renamed/merged from a "Kategorien" list in Datenbank → Lebensmittel. *(2026-09-30)*
- App icon: white apple with orange leaf and a green point, on green (option 07). Files in `public/`. *(2026-09-28)*

## 9. Out of scope for v1

- Multi-user / sharing
- Export/import of the food catalog (CSV) — except the one-off migration in PLAN.md Phase 6
- Barcode scanning, online nutrition databases
- Dark mode
