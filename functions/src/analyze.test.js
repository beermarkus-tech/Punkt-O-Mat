import { describe, expect, it, vi } from 'vitest'
import {
  AnalysisError,
  ALLOWED_EMAIL,
  DAILY_CAP,
  MAX_HINT_CHARS,
  MAX_IMAGE_CHARS,
  assertAllowed,
  buildRequest,
  cleanResult,
  parisDate,
  reserveQuota,
  runAnalysis,
  userText,
  validateInput,
} from './analyze.js'

const goodAuth = { token: { email: ALLOWED_EMAIL, email_verified: true } }
const IMG = 'A'.repeat(500)
const goodData = { imageBase64: IMG, mimeType: 'image/jpeg', hint: '', knownFoods: [{ id: 'abc123', name: 'Brezel' }] }

/** In-memory stand-in for the Firestore Admin API pieces the quota code uses. */
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

const item = (over = {}) => ({
  name: 'Spaghetti',
  matchedFoodId: null,
  grams: 250,
  kcalPer100: 150,
  fatPer100: 2,
  confidence: 'mittel',
  optional: false,
  note: '',
  ...over,
})
const okResponse = (parsed, over = {}) => ({
  stop_reason: 'end_turn',
  parsed_output: parsed,
  model: 'claude-opus-5-5',
  usage: { input_tokens: 3000, output_tokens: 700 },
  ...over,
})
const clientReturning = (response) => ({ messages: { parse: vi.fn().mockResolvedValue(response) } })
const codeOf = async (promise) => {
  try {
    await promise
  } catch (e) {
    return e.code
  }
  return 'no error'
}

describe('access (§6)', () => {
  it('needs a signed-in user', () => {
    expect(() => assertAllowed(null)).toThrow(AnalysisError)
    expect(() => assertAllowed(undefined)).toThrow(/anmelden/)
  })
  it('rejects any other Google account, even a verified one', () => {
    expect(() => assertAllowed({ token: { email: 'someone@gmail.com', email_verified: true } })).toThrow(/Kein Zugriff/)
  })
  it('rejects an unverified email', () => {
    expect(() => assertAllowed({ token: { email: ALLOWED_EMAIL, email_verified: false } })).toThrow(AnalysisError)
    expect(() => assertAllowed({ token: { email: ALLOWED_EMAIL } })).toThrow(AnalysisError)
  })
  it('lets Markus in', () => {
    expect(() => assertAllowed(goodAuth)).not.toThrow()
  })
})

describe('daily cap', () => {
  it('uses the Paris date, not UTC', () => {
    expect(parisDate(new Date('2026-09-27T22:30:00Z'))).toBe('2026-09-28')
    expect(parisDate(new Date('2026-09-27T21:30:00Z'))).toBe('2026-09-27')
  })
  it('allows exactly the cap and then refuses', async () => {
    const db = fakeDb()
    for (let i = 0; i < DAILY_CAP; i++) await reserveQuota(db, '2026-10-05')
    expect(await codeOf(reserveQuota(db, '2026-10-05'))).toBe('resource-exhausted')
    expect(db.store.get('aiUsage/2026-10-05').count).toBe(DAILY_CAP)
  })
  it('counts every day separately', async () => {
    const db = fakeDb()
    for (let i = 0; i < DAILY_CAP; i++) await reserveQuota(db, '2026-10-05')
    await expect(reserveQuota(db, '2026-10-06')).resolves.toBeUndefined()
  })
})

describe('validateInput', () => {
  it('accepts a normal request', () => {
    const v = validateInput(goodData)
    expect(v).toMatchObject({ mimeType: 'image/jpeg', hint: '', foods: [{ id: 'abc123', name: 'Brezel' }] })
  })
  it('strips a data: URL prefix', () => {
    expect(validateInput({ ...goodData, imageBase64: `data:image/jpeg;base64,${IMG}` }).imageBase64).toBe(IMG)
  })
  it('rejects missing, oversized and wrongly typed images', () => {
    expect(() => validateInput({})).toThrow(/Foto/)
    expect(() => validateInput({ ...goodData, imageBase64: 'x'.repeat(MAX_IMAGE_CHARS + 1) })).toThrow(/zu groß/)
    expect(() => validateInput({ ...goodData, mimeType: 'image/gif' })).toThrow(/Bildformat/)
    expect(() => validateInput({ ...goodData, mimeType: undefined })).toThrow(AnalysisError)
  })
  it('limits and cleans the hint and the food list', () => {
    const v = validateInput({
      ...goodData,
      hint: `halbe\nPortion ${'x'.repeat(1000)}`,
      knownFoods: [{ id: 'a\tb', name: 'Käse\nbrot' }, { id: 5, name: 'bad' }, null, { id: 'c', name: '' }],
    })
    expect(v.hint.length).toBeLessThanOrEqual(MAX_HINT_CHARS)
    expect(v.hint).not.toMatch(/\n/)
    expect(v.foods).toEqual([{ id: 'a b', name: 'Käse brot' }])
  })
  it('rejects a food list that is not a list', () => {
    expect(() => validateInput({ ...goodData, knownFoods: 'nope' })).toThrow(/Lebensmittelliste/)
  })
})

describe('buildRequest', () => {
  const base = { model: 'claude-opus-5-5', imageBase64: IMG, mimeType: 'image/jpeg', foods: [{ id: 'abc', name: 'Brezel' }], hint: 'halbe Portion' }
  it('sends the image first, then the food list and the hint', () => {
    const r = buildRequest(base)
    const [image, text] = r.messages[0].content
    expect(image).toEqual({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: IMG } })
    expect(text.text).toContain('abc\tBrezel')
    expect(text.text).toContain('halbe Portion')
    expect(r.model).toBe('claude-opus-5-5')
    expect(r.output_config.format).toBeDefined()
  })
  it('leaves room for thinking tokens', () => {
    expect(buildRequest(base).max_tokens).toBeGreaterThanOrEqual(8000)
  })
  it('sets effort on models that support it, but not on Haiku', () => {
    expect(buildRequest(base).output_config.effort).toBe('low')
    expect(buildRequest({ ...base, model: 'claude-sonnet-5-5' }).output_config.effort).toBe('low')
    expect(buildRequest({ ...base, model: 'claude-haiku-4-5' }).output_config.effort).toBeUndefined()
  })
  it('handles an empty catalog', () => {
    expect(userText([], '')).toContain('(keine)')
  })
})

describe('cleanResult', () => {
  const foods = [{ id: 'real1', name: 'Brezel' }]
  it('turns invented ids into "no match"', () => {
    const r = cleanResult({ mealTitle: 'x', items: [item({ matchedFoodId: 'real1' }), item({ name: 'Käse', matchedFoodId: 'made-up-id' })] }, foods)
    expect(r.items.map((i) => i.matchedFoodId)).toEqual(['real1', null])
  })
  it('clamps absurd numbers and drops items without name or weight', () => {
    const r = cleanResult(
      { mealTitle: '', items: [item({ grams: 99999, kcalPer100: 5000, fatPer100: -3 }), item({ name: '  ' }), item({ grams: 0 }), item({ grams: NaN })] },
      foods,
    )
    expect(r.items).toHaveLength(1)
    expect(r.items[0]).toMatchObject({ grams: 3000, kcalPer100: 900, fatPer100: 0 })
  })
  it('rounds grams and keeps one decimal for nutrition values', () => {
    const r = cleanResult({ mealTitle: '', items: [item({ grams: 123.6, kcalPer100: 151.26, fatPer100: 2.04 })] }, foods)
    expect(r.items[0]).toMatchObject({ grams: 124, kcalPer100: 151.3, fatPer100: 2 })
  })
  it('limits the number of items and normalises confidence', () => {
    const many = Array.from({ length: 50 }, (_, i) => item({ name: `Ding ${i}`, confidence: 'unklar' }))
    const r = cleanResult({ mealTitle: 'y', items: many }, foods)
    expect(r.items).toHaveLength(20)
    expect(r.items[0].confidence).toBe('niedrig')
  })
  it('copes with a missing item list', () => {
    expect(cleanResult({ mealTitle: 'Nur Titel' }, foods)).toEqual({ mealTitle: 'Nur Titel', items: [] })
  })
})

describe('runAnalysis', () => {
  const run = (response, over = {}) => {
    const db = over.db ?? fakeDb()
    const client = over.client ?? clientReturning(response)
    return { db, client, promise: runAnalysis({ auth: goodAuth, data: goodData, ...over.request }, { db, client, model: 'claude-opus-5-5', now: new Date('2026-10-05T10:00:00Z') }) }
  }

  it('returns the cleaned items and usage numbers', async () => {
    const { promise, client, db } = run(okResponse({ mealTitle: 'Pasta', items: [item({ matchedFoodId: 'abc123' })] }))
    const result = await promise
    expect(result.mealTitle).toBe('Pasta')
    expect(result.items[0]).toMatchObject({ name: 'Spaghetti', matchedFoodId: 'abc123', grams: 250 })
    expect(result.meta).toEqual({ model: 'claude-opus-5-5', inputTokens: 3000, outputTokens: 700 })
    expect(client.messages.parse).toHaveBeenCalledTimes(1)
    expect(db.store.get('aiUsage/2026-10-05').count).toBe(1)
  })

  it('does not call Claude for the wrong user or bad input, and does not use quota', async () => {
    const db = fakeDb()
    const client = clientReturning(okResponse({ mealTitle: '', items: [] }))
    expect(await codeOf(runAnalysis({ auth: { token: { email: 'x@y.z', email_verified: true } }, data: goodData }, { db, client, model: 'm' }))).toBe('permission-denied')
    expect(await codeOf(runAnalysis({ auth: goodAuth, data: {} }, { db, client, model: 'm' }))).toBe('invalid-argument')
    expect(client.messages.parse).not.toHaveBeenCalled()
    expect(db.store.size).toBe(0)
  })

  it('does not call Claude once the daily cap is reached', async () => {
    const db = fakeDb()
    db.store.set('aiUsage/2026-10-05', { count: DAILY_CAP })
    const { promise, client } = run(okResponse({ mealTitle: '', items: [] }), { db })
    expect(await codeOf(promise)).toBe('resource-exhausted')
    expect(client.messages.parse).not.toHaveBeenCalled()
  })

  it('reports a refusal, a truncated answer and an unreadable answer clearly', async () => {
    expect(await codeOf(run(okResponse(null, { stop_reason: 'refusal' })).promise)).toBe('failed-precondition')
    expect(await codeOf(run(okResponse(null, { stop_reason: 'max_tokens' })).promise)).toBe('internal')
    expect(await codeOf(run(okResponse(null)).promise)).toBe('internal')
  })

  it('maps API errors to useful codes', async () => {
    const failing = (status) => ({ messages: { parse: vi.fn().mockRejectedValue(Object.assign(new Error('boom'), { status })) } })
    expect(await codeOf(run(null, { client: failing(429) }).promise)).toBe('resource-exhausted')
    expect(await codeOf(run(null, { client: failing(529) }).promise)).toBe('unavailable')
    expect(await codeOf(run(null, { client: failing(500) }).promise)).toBe('unavailable')
    expect(await codeOf(run(null, { client: failing(undefined) }).promise)).toBe('unavailable') // network error
    expect(await codeOf(run(null, { client: failing(400) }).promise)).toBe('internal')
  })

  it('an empty list is a valid answer (no food visible)', async () => {
    const result = await run(okResponse({ mealTitle: '', items: [] })).promise
    expect(result.items).toEqual([])
  })
})
