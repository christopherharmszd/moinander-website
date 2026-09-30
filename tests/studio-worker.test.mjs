import test from 'node:test'
import assert from 'node:assert/strict'
import worker, {cleanDocument} from '../studio/worker.js'
import {createPasswordRecord} from '../studio/auth.js'

const origin = 'https://moinander-studio.christopher-harms.workers.dev'

test('project and event fields match the public Sanity schema', () => {
  const project = cleanDocument({_type: 'project', title: 'Rugby für Schulen', summary: 'Ein Schulprojekt.', body: 'Erster Absatz.\n\nZweiter Absatz.', featuredOnHome: true, homeOrder: 2, publish: true}).doc
  assert.equal(project.slug.current, 'rugby-fur-schulen')
  assert.equal(project._id.startsWith('project-'), true)
  assert.equal(project.body.length, 2)
  assert.equal(project.homeOrder, 2)
  assert.equal(project.articleTemplate, 'feature')
  const event = cleanDocument({_type: 'event', title: 'Turnier', summary: 'Gemeinsam spielen.', startsAt: '2026-11-14T10:00:00.000Z', publish: false}).doc
  assert.equal(event._id.startsWith('drafts.event-'), true)
  assert.equal(event.startsAt, '2026-11-14T10:00:00.000Z')
})

test('rejects invalid public data before reaching Sanity', () => {
  assert.throws(() => cleanDocument({_type: 'project', title: 'Ohne Beschreibung', publish: true}), /Kurzbeschreibung/)
  assert.throws(() => cleanDocument({_type: 'event', title: 'Termin', summary: 'Kurz', startsAt: 'ungültig', publish: true}), /Datum/)
  assert.throws(() => cleanDocument({_type: 'partner', name: 'Partner', kind: 'Unbekannt', website: 'javascript:alert(1)', publish: true}), /Webadresse/)
})

test('keeps article block order and protects incomplete image positions', () => {
  const body = [
    {key: 'heading1', type: 'text', style: 'h2', text: 'Mehr als ein Bierwagen?'},
    {key: 'paragraph1', type: 'text', style: 'normal', text: 'Ein offener Dorfabend.'},
    {key: 'photo1', type: 'image', imageAssetId: 'image-1234567890-png', alt: 'Das Team', caption: 'Das Rudelbar-Team', credit: 'Foto: Moinander', note: 'Freigabe intern prüfen'},
  ]
  const doc = cleanDocument({_type: 'project', title: 'Rudelbar', articleTemplate: 'photo', summary: 'Ein mobiler Treffpunkt.', body, publish: true}).doc
  assert.equal(doc.articleTemplate, 'photo')
  assert.deepEqual(doc.body.map((block) => block._type), ['block', 'block', 'image'])
  assert.equal(doc.body[0].style, 'h2')
  assert.equal(doc.body[2].asset._ref, 'image-1234567890-png')
  assert.equal(doc.body[2].caption, 'Das Rudelbar-Team')
  assert.equal('note' in doc.body[2], false)
  assert.throws(() => cleanDocument({_type: 'project', title: 'Rudelbar', summary: 'Ein mobiler Treffpunkt.', body: [{key: 'photo2', type: 'image', note: 'Bild folgt'}], publish: true}), /Bildblock/)
  const draft = cleanDocument({_type: 'project', title: 'Rudelbar', summary: 'Ein mobiler Treffpunkt.', body: [{key: 'photo2', type: 'image', note: 'Bild folgt'}], publish: false}).doc
  assert.equal(draft.body[0].note, 'Bild folgt')
  assert.throws(() => cleanDocument({_type: 'project', title: 'Rudelbar', articleTemplate: 'unbekannt', summary: 'Kurz', body: [], publish: false}), /Beitragsvorlage/)
})

test('keeps several paragraphs in one editable text section', () => {
  const body = [{key: 'longtext1', type: 'text', style: 'normal', text: 'Erster Absatz.\n\nZweiter Absatz.\nNoch eine Zeile.'}]
  const doc = cleanDocument({_type: 'project', title: 'Rudelbar', summary: 'Ein mobiler Treffpunkt.', body, publish: false}).doc
  assert.equal(doc.body.length, 1)
  assert.equal(doc.body[0]._type, 'textSection')
  assert.equal(doc.body[0]._key, 'longtext1')
  assert.equal(doc.body[0].text, body[0].text)
})

test('login protects content APIs and uses an HttpOnly session with CSRF', async () => {
  const account = await createPasswordRecord('info@moinander.de', 'vier Wiesen tragen Ideen 2026')
  const env = {
    STUDIO_ADMIN_ACCOUNTS: JSON.stringify([account]),
    STUDIO_SESSION_SECRET: 'a test session secret with more than thirty-two characters',
    SANITY_WRITE_TOKEN: 'test-editor-token',
    LOGIN_LIMITER: {limit: async () => ({success: true})},
    ASSETS: {fetch: async () => new Response('asset')},
  }
  const unauthorized = await worker.fetch(new Request(`${origin}/api/documents?type=project`), env)
  assert.equal(unauthorized.status, 401)
  const login = await worker.fetch(new Request(`${origin}/api/login`, {method: 'POST', headers: {'origin': origin, 'content-type': 'application/json'}, body: JSON.stringify({email: 'info@moinander.de', password: 'vier Wiesen tragen Ideen 2026'})}), env)
  assert.equal(login.status, 200)
  const cookie = login.headers.get('set-cookie')
  assert.match(cookie, /HttpOnly/)
  assert.match(cookie, /SameSite=Strict/)
  const session = await worker.fetch(new Request(`${origin}/api/session`, {headers: {cookie}}), env)
  const csrf = (await session.json()).user.csrf
  const blocked = await worker.fetch(new Request(`${origin}/api/documents`, {method: 'POST', headers: {cookie, origin: 'https://example.org', 'content-type': 'application/json', 'x-csrf-token': csrf}, body: '{}'}), env)
  assert.equal(blocked.status, 403)
})
