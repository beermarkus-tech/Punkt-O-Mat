#!/usr/bin/env bash
# Deploys only the Punkt-o-Mat photo-analysis function (run from Google Cloud Shell).
# Never touches the other functions in the shared Firebase project.
set -euo pipefail
cd "$(dirname "$0")/.."
npm --prefix functions install --omit=dev --no-audit --no-fund
firebase deploy --only functions:punkt-o-mat:analyzeMeal --project exercise-tracker-26120
