import { describe, expect, it, vi } from 'vitest'
import { ALLOWED_EMAIL, DAILY_CAP } from './analyze.js'
import { buildLookupRequest, cleanLookup, lookupText, runLookup, validateLookup } from './lookup.js'

const auth = { token: { email: ALLOWED_EMAIL, email_verified: true } }
const cats = ['Getränke', 'Obst']

function fakeDb() {
  const store = new Map()
  return {
    store,
    collection: (c) => ({ doc: (id) => ({ key: `${c}/${id}` }) }),
    runTransaction: async (fn) =>
      fn({
        get: async (ref) => ({ exists: store.has(ref.key), data: () => store.get(ref.key) }),
        set: (ref, data) => store.set(ref.key, { ...(store.get(ref.key) ?? {}), ...data }),
      }),
  }
}
const cand = (over = {}) => ({ name: 'Weißwein, trocken', kcalPer100: 71, fatPer100: 0, category: 'Getränke', units: [{ label: 'Glas', grams: 150 }], note: '', ...over })
const ok = (parsed, over = {}) => ({ stop_reason: 'end_turn', parsed_output: parsed, model: 'm', usage: { input_tokens: 500, output_tokens: 200 }, ...over })
const codeOf = async (p) => {
  try {
    await p
  } catch (e) {
    return e.code
  }
  return 'no error'
}

describe('validateLookup', () => {
  it('needs a name and cleans the categories', () => {
    expect(() => validateLookup({ name: '  ' })).toThrow(/Namen/)
    expect(() => validateLookup({ name: 'x', categories: 'nope' })).toThrow(/Kategorien/)
    expect(validateLookup({ name: 'Wein\nrot', categories: ['A\tB', 'A B', 5, ''] })).toEqual({ name: 'Wein rot', categories: ['A B'] })
  })
})

describe('request', () => {
  it('asks about the name and lists the categories, with effort only where supported', () => {
    expect(lookupText('Wein', cats)).toContain('Lebensmittel: Wein')
    expect(lookupText('Wein', cats)).toContain('Getränke')
    expect(buildLookupRequest({ model: 'claude-opus-5-5', name: 'Wein', categories: cats }).output_config.effort).toBe('low')
    expect(buildLookupRequest({ model: 'claude-haiku-4-5', name: 'Wein', categories: cats }).output_config.effort).toBeUndefined()
  })
})

describe('cleanLookup', () => {
  it('keeps only known categories (case-insensitive) and at most 4 candidates', () => {
    const r = cleanLookup({ candidates: [cand({ category: 'getränke' }), cand({ category: 'Erfunden' }), ...Array.from({ length: 6 }, (_, i) => cand({ name: `W${i}` }))] }, cats)
    expect(r.candidates).toHaveLength(4)
    expect(r.candidates[0].category).toBe('Getränke')
    expect(r.candidates[1].category).toBeNull()
  })
  it('clamps numbers, drops unusable sizes and nameless candidates', () => {
    const r = cleanLookup(
      { candidates: [cand({ kcalPer100: 5000, fatPer100: -2, units: [{ label: '100 g', grams: 100 }, { label: 'Glas', grams: 0 }, { label: 'Flasche', grams: 750 }, { label: 'a', grams: 1 }, { label: 'b', grams: 2 }, { label: 'c', grams: 3 }] }), cand({ name: ' ' })] },
      cats,
    )
    expect(r.candidates).toHaveLength(1)
    expect(r.candidates[0]).toMatchObject({ kcalPer100: 900, fatPer100: 0 })
    expect(r.candidates[0].units).toEqual([{ label: 'Flasche', grams: 750 }, { label: 'a', grams: 1 }, { label: 'b', grams: 2 }])
  })
  it('an empty or missing list is fine', () => {
    expect(cleanLookup({}, cats)).toEqual({ candidates: [] })
  })
})

describe('runLookup', () => {
  const deps = (response, db = fakeDb()) => ({ db, client: { messages: { parse: vi.fn().mockResolvedValue(response) } }, model: 'claude-opus-5-5', now: new Date('2026-10-09T10:00:00Z') })
  it('returns candidates and counts against the shared daily cap', async () => {
    const d = deps(ok({ candidates: [cand()] }))
    const r = await runLookup({ auth, data: { name: 'Wein', categories: cats } }, d)
    expect(r.candidates[0].name).toBe('Weißwein, trocken')
    expect(d.db.store.get('aiUsage/2026-10-09').count).toBe(1)
  })
  it('refuses other users and a full day before calling Claude', async () => {
    const d = deps(ok({ candidates: [] }))
    expect(await codeOf(runLookup({ auth: { token: { email: 'x@y.z', email_verified: true } }, data: { name: 'Wein' } }, d))).toBe('permission-denied')
    d.db.store.set('aiUsage/2026-10-09', { count: DAILY_CAP })
    expect(await codeOf(runLookup({ auth, data: { name: 'Wein' } }, d))).toBe('resource-exhausted')
    expect(d.client.messages.parse).not.toHaveBeenCalled()
  })
  it('reports refusals and unreadable answers', async () => {
    expect(await codeOf(runLookup({ auth, data: { name: 'Wein' } }, deps(ok(null, { stop_reason: 'refusal' }))))).toBe('failed-precondition')
    expect(await codeOf(runLookup({ auth, data: { name: 'Wein' } }, deps(ok(null))))).toBe('internal')
  })
})
