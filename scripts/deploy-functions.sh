#!/usr/bin/env bash
# Deploys only the Punkt-o-Mat photo-analysis and food-lookup functions (run from Google Cloud Shell).
# Never touches the other functions in the shared Firebase project.
set -euo pipefail
cd "$(dirname "$0")/.."
npm --prefix functions install --omit=dev --no-audit --no-fund
firebase deploy --only functions:punkt-o-mat:analyzeMeal,functions:punkt-o-mat:lookupFood --project exercise-tracker-26120
