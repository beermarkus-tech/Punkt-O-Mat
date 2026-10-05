import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { defineSecret, defineString } from 'firebase-functions/params'
import { logger } from 'firebase-functions'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import Anthropic from '@anthropic-ai/sdk'
import { AnalysisError, runAnalysis } from './src/analyze.js'

// Dedicated key in its own Anthropic workspace. The secret name is unique on purpose: the shared Firebase project
// also hosts other apps' functions (Stripe), and Secret Manager is project-wide.
const anthropicKey = defineSecret('PUNKTOMAT_ANTHROPIC_KEY')
// Change in functions/.env (PUNKTOMAT_MODEL=claude-sonnet-5-5) and redeploy to try another model (PLAN.md phase 8d).
const model = defineString('PUNKTOMAT_MODEL', { default: 'claude-opus-5-5' })

const app = initializeApp()
// The app's data lives in the named database "punkt-o-mat", not "(default)".
const db = getFirestore(app, 'punkt-o-mat')

/**
 * Photo meal analysis (spec.md §4.8): callable from the signed-in app only; the Anthropic key never leaves the server.
 * The cap on parallel instances bounds cost if something goes wrong.
 */
export const analyzeMeal = onCall(
  { region: 'europe-west1', timeoutSeconds: 120, memory: '512MiB', maxInstances: 3, secrets: [anthropicKey] },
  async (request) => {
    try {
      // Two tries of at most 55 s each stay inside the 120 s function timeout.
      const client = new Anthropic({ apiKey: anthropicKey.value(), timeout: 55_000, maxRetries: 1 })
      const result = await runAnalysis(request, { db, client, model: model.value() })
      logger.info('analyzeMeal ok', { items: result.items.length, ...result.meta })
      return result
    } catch (err) {
      if (err instanceof AnalysisError) throw new HttpsError(err.code, err.message)
      logger.error('analyzeMeal failed', err)
      throw new HttpsError('internal', 'Analyse fehlgeschlagen. Bitte nochmal versuchen.')
    }
  },
)
