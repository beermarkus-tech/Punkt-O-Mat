import { getFunctions, httpsCallable } from 'firebase/functions'
import { app } from '../firebase'

// The Anthropic key lives only in the Cloud Function (spec.md §5); the phone just calls it, signed in.
const functions = getFunctions(app, 'europe-west1')
const analyzeMeal = httpsCallable(functions, 'analyzeMeal', { timeout: 110_000 })

const MAX_EDGE = 1568
const QUALITY = 0.75

/** Shrink a photo on the phone: long edge ≤ 1568 px, JPEG. Returns { imageBase64, mimeType, previewUrl }. */
export async function prepareImage(file) {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('decode'))
      el.src = url
    })
    const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', QUALITY))
    if (!blob) throw new Error('encode')
    const imageBase64 = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result).split(',')[1])
      reader.onerror = () => reject(new Error('read'))
      reader.readAsDataURL(blob)
    })
    return { imageBase64, mimeType: 'image/jpeg', previewUrl: URL.createObjectURL(blob) }
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function analyzePhoto({ imageBase64, mimeType, hint, knownFoods }) {
  const res = await analyzeMeal({ imageBase64, mimeType, hint, knownFoods })
  return res.data
}

/**
 * Connection test for Einstellungen: sends no photo, so the function answers "invalid-argument"
 * right after checking who is calling. That proves it is deployed and reachable and costs nothing.
 */
export async function pingAnalysis() {
  try {
    await analyzeMeal({})
    return { ok: true }
  } catch (err) {
    const code = String(err?.code ?? '').replace('functions/', '')
    if (code === 'invalid-argument') return { ok: true }
    if (code === 'permission-denied' || code === 'unauthenticated') return { ok: false, message: 'Kein Zugriff.' }
    return { ok: false, message: 'Nicht erreichbar.' }
  }
}

const lookupFoodCall = httpsCallable(functions, 'lookupFood', { timeout: 45_000 })

/** Typical values for a food name, from Claude's own knowledge (spec.md §4.9). Returns { candidates }. */
export async function lookupFood({ name, categories }) {
  const res = await lookupFoodCall({ name, categories })
  return res.data
}
