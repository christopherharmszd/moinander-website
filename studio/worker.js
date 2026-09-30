import {accounts, clearedSessionCookie, getSession, newSessionCookie, sameOrigin, verifyLogin} from './auth.js'

const PROJECT = 'nqq96vbs'
const DATASET = 'production'
const BASE = `https://${PROJECT}.api.sanity.io/v2025-02-19`
const TYPES = new Set(['project', 'event', 'partner', 'boardMember'])

function json(value, status = 200, headers = {}) {
  return new Response(JSON.stringify(value), {status, headers: {
    'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store',
    'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer', ...headers,
  }})
}

async function sanity(path, env, options = {}) {
  if (!env.SANITY_WRITE_TOKEN) return json({error: 'Die Verbindung zum Inhaltsspeicher ist noch nicht eingerichtet.'}, 503)
  let response
  try {
    response = await fetch(`${BASE}${path}`, {
      ...options,
      headers: {Authorization: `Bearer ${env.SANITY_WRITE_TOKEN}`, ...(options.headers || {})},
    })
  } catch { return json({error: 'Der Inhaltsspeicher ist momentan nicht erreichbar.'}, 502) }
  if (!response.ok) return json({error: 'Sanity hat die Anfrage abgelehnt.', status: response.status}, response.status >= 500 ? 502 : 400)
  try { return json(await response.json()) } catch { return json({error: 'Unerwartete Antwort des Inhaltsspeichers.'}, 502) }
}

async function sanityResult(query, env) {
  const response = await sanity(`/data/query/${DATASET}?query=${encodeURIComponent(query)}&perspective=raw`, env)
  if (!response.ok) return {response}
  return {result: (await response.json()).result}
}

function text(value, limit = 5000) {
  if (value == null) return ''
  if (typeof value !== 'string' || value.length > limit) throw new Error('Ein Textfeld ist ungültig oder zu lang.')
  return value.trim()
}

function url(value) {
  const trimmed = text(value, 1000)
  if (!trimmed) return undefined
  try {
    const parsed = new URL(trimmed)
    if (!['https:', 'http:'].includes(parsed.protocol)) throw new Error()
    return parsed.href
  } catch { throw new Error('Bitte eine gültige Webadresse mit https:// eingeben.') }
}

function date(value) {
  const trimmed = text(value, 50)
  if (!trimmed) return undefined
  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) throw new Error('Datum oder Uhrzeit ist ungültig.')
  return parsed.toISOString()
}

function number(value, min = 0, max = 9999) {
  if (value === '' || value == null) return undefined
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) throw new Error('Die Reihenfolge ist ungültig.')
  return parsed
}

function image(ref, alt) {
  if (!ref) return undefined
  if (typeof ref !== 'string' || !/^image-[a-zA-Z0-9_-]{10,}$/.test(ref)) throw new Error('Das Bild ist ungültig.')
  return {_type: 'image', asset: {_type: 'reference', _ref: ref}, alt: text(alt, 300)}
}

function key(value) {
  return typeof value === 'string' && /^[a-zA-Z0-9_-]{6,40}$/.test(value)
    ? value : crypto.randomUUID().replace(/-/g, '').slice(0, 12)
}

function textBlock(value, style = 'normal', id) {
  const content = text(value, 10000)
  if (!content) return null
  if (!['normal', 'h2', 'h3'].includes(style)) throw new Error('Unbekannte Textformatierung.')
  return {
    _type: 'block', _key: key(id), style, markDefs: [],
    children: [{_type: 'span', _key: key(), text: content.replace(/\n/g, ' '), marks: []}],
  }
}

function blocks(value, {publish = false} = {}) {
  if (value == null) return []
  if (typeof value === 'string') {
    const raw = text(value, 30000)
    return raw ? raw.split(/\n\s*\n/).filter(Boolean).slice(0, 80).map((paragraph) => textBlock(paragraph)) : []
  }
  if (!Array.isArray(value) || value.length > 100) throw new Error('Der Beitrag enthält zu viele oder ungültige Blöcke.')
  const result = []
  for (const item of value) {
    if (!item || typeof item !== 'object') throw new Error('Ein Beitragsblock ist ungültig.')
    if (item.type === 'image') {
      const asset = image(item.imageAssetId, item.alt)
      if (!asset && publish) throw new Error('Bitte für jeden Bildblock ein Bild hochladen oder den leeren Bildblock entfernen.')
      const caption = text(item.caption, 300)
      const credit = text(item.credit, 200)
      const note = text(item.note, 300)
      result.push({_type: 'image', _key: key(item.key), ...(asset || {}), caption, credit, ...(!publish && note ? {note} : {})})
    } else if (item.type === 'text') {
      const block = textBlock(item.text, item.style || 'normal', item.key)
      if (block) result.push(block)
    } else throw new Error('Unbekannter Beitragsblock.')
  }
  return result
}

function slug(value) {
  const clean = text(value, 140).toLowerCase().replace(/ß/g, 'ss').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  if (!clean) throw new Error('Bitte einen Titel für die Webadresse eingeben.')
  return clean
}

function cleanDocument(input) {
  if (!input || !TYPES.has(input._type)) throw new Error('Unbekannter Inhaltsbereich.')
  const type = input._type
  const id = input._id ? String(input._id).replace(/^drafts\./, '') : `${type}-${crypto.randomUUID()}`
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id)) throw new Error('Ungültige Dokument-ID.')
  const publish = input.publish === true
  const doc = {_id: publish ? id : `drafts.${id}`, _type: type}
  if (type === 'project') {
    doc.title = text(input.title, 180)
    doc.slug = {_type: 'slug', current: slug(input.slug || doc.title)}
    doc.kind = text(input.kind, 80)
    doc.articleTemplate = text(input.articleTemplate || 'feature', 20)
    if (!['short', 'photo', 'feature'].includes(doc.articleTemplate)) throw new Error('Unbekannte Beitragsvorlage.')
    doc.summary = text(input.summary, 300)
    doc.body = blocks(input.body, {publish})
    doc.publishedAt = date(input.publishedAt) || new Date().toISOString()
    doc.featuredOnHome = input.featuredOnHome === true
    doc.homeOrder = doc.featuredOnHome ? number(input.homeOrder, 1, 3) : undefined
    doc.image = image(input.imageAssetId, input.imageAlt)
    if (doc.featuredOnHome && !doc.homeOrder) throw new Error('Für die Startseite bitte Platz 1, 2 oder 3 wählen.')
  } else if (type === 'event') {
    doc.title = text(input.title, 180)
    doc.startsAt = date(input.startsAt)
    doc.endsAt = date(input.endsAt)
    doc.location = text(input.location, 200)
    doc.summary = text(input.summary, 300)
    doc.description = blocks(input.description)
    doc.link = url(input.link)
    if (doc.endsAt && doc.startsAt && doc.endsAt < doc.startsAt) throw new Error('Das Ende muss nach dem Beginn liegen.')
  } else if (type === 'partner') {
    doc.name = text(input.name, 180)
    doc.kind = text(input.kind, 20)
    doc.summary = text(input.summary, 1000)
    doc.website = url(input.website)
    doc.sortOrder = number(input.sortOrder)
    doc.logo = image(input.imageAssetId, input.imageAlt)
    if (!['Partner', 'Sponsor'].includes(doc.kind)) throw new Error('Bitte Partner oder Sponsor wählen.')
  } else {
    doc.name = text(input.name, 180)
    doc.role = text(input.role, 180)
    doc.sortOrder = number(input.sortOrder)
    doc.portrait = image(input.imageAssetId, input.imageAlt)
  }
  if ((type === 'project' || type === 'event') && (!doc.title || !doc.summary)) throw new Error('Titel und Kurzbeschreibung fehlen.')
  if (type === 'event' && !doc.startsAt) throw new Error('Bitte einen Beginn eintragen.')
  if ((type === 'partner' || type === 'boardMember') && !doc.name) throw new Error('Bitte einen Namen eintragen.')
  if (type === 'boardMember' && !doc.role) throw new Error('Bitte ein Amt eintragen.')
  if (!publish && input.archived === true) doc.archived = true
  return {doc, id, publish}
}

async function login(request, env, list) {
  const target = new URL(request.url)
  if (target.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(target.hostname)) return json({error: 'Sichere Verbindung erforderlich.'}, 403)
  if (!sameOrigin(request) || !request.headers.get('content-type')?.startsWith('application/json')) return json({error: 'Ungültige Anmeldung.'}, 403)
  const ip = request.headers.get('cf-connecting-ip') || 'unknown'
  if (!(await env.LOGIN_LIMITER.limit({key: `moinander:login:ip:${ip}`})).success) return json({error: 'Zu viele Anmeldeversuche. Bitte später erneut versuchen.'}, 429)
  const raw = await request.text()
  if (raw.length > 4096) return json({error: 'Ungültige Anmeldung.'}, 400)
  let input
  try { input = JSON.parse(raw) } catch { return json({error: 'Ungültige Anmeldung.'}, 400) }
  const email = String(input.email || '').trim().toLowerCase()
  if (!(await env.LOGIN_LIMITER.limit({key: `moinander:login:account:${email.slice(0, 254)}`})).success) return json({error: 'Zu viele Anmeldeversuche. Bitte später erneut versuchen.'}, 429)
  const account = await verifyLogin(email, input.password, list)
  if (!account) return json({error: 'E-Mail oder Passwort stimmt nicht.'}, 401)
  const {cookie} = await newSessionCookie(request, env, account)
  return json({ok: true}, 200, {'set-cookie': cookie})
}

async function save(request, env) {
  const raw = await request.text()
  if (raw.length > 65000) return json({error: 'Der Inhalt ist zu groß.'}, 413)
  let input, parsed
  try { input = JSON.parse(raw); parsed = cleanDocument(input) } catch (error) { return json({error: error.message || 'Ungültiger Inhalt.'}, 400) }
  const {doc, id, publish} = parsed
  if (publish && doc._type === 'project') {
    const existing = await sanityResult(`*[_type == "project" && _id != "${id}" && _id != "drafts.${id}" && slug.current == "${doc.slug.current}"][0]._id`, env)
    if (existing.response) return existing.response
    if (existing.result) return json({error: 'Diese Webadresse ist bereits vergeben.'}, 409)
    if (doc.featuredOnHome) {
      const slot = await sanityResult(`*[_type == "project" && !(_id in path("drafts.**")) && _id != "${id}" && featuredOnHome == true && homeOrder == ${doc.homeOrder}][0]._id`, env)
      if (slot.response) return slot.response
      if (slot.result) return json({error: `Startseitenplatz ${doc.homeOrder} ist bereits vergeben.`}, 409)
    }
  }
  return sanity(`/data/mutate/${DATASET}?returnIds=true`, env, {
    method: 'POST', headers: {'content-type': 'application/json'},
    body: JSON.stringify({mutations: [{createOrReplace: doc}, {delete: {id: publish ? `drafts.${id}` : id}}]}),
  })
}

async function changeStatus(request, env) {
  let input
  try { input = await request.json() } catch { return json({error: 'Ungültige Aktion.'}, 400) }
  const type = input?.type, id = String(input?.id || '').replace(/^drafts\./, '')
  if (!TYPES.has(type) || !/^[a-zA-Z0-9_-]{1,128}$/.test(id) || !['unpublish', 'archive', 'restore', 'delete'].includes(input.action)) return json({error: 'Ungültige Aktion.'}, 400)
  const lookup = await sanityResult(`*[_id in ["${id}", "drafts.${id}"]]`, env)
  if (lookup.response) return lookup.response
  const source = lookup.result.find((item) => item._id === `drafts.${id}`) || lookup.result.find((item) => item._id === id)
  if (!source || source._type !== type) return json({error: 'Inhalt nicht gefunden.'}, 404)
  if (input.action === 'delete') {
    if (source._id !== `drafts.${id}` || lookup.result.some((item) => item._id === id)) return json({error: 'Nur unveröffentlichte Entwürfe können gelöscht werden.'}, 409)
    return sanity(`/data/mutate/${DATASET}?returnIds=true`, env, {
      method: 'POST', headers: {'content-type': 'application/json'},
      body: JSON.stringify({mutations: [{delete: {id: source._id}}]}),
    })
  }
  const draft = {...source, _id: `drafts.${id}`, archived: input.action === 'archive'}
  delete draft._rev; delete draft._createdAt; delete draft._updatedAt
  return sanity(`/data/mutate/${DATASET}?returnIds=true`, env, {
    method: 'POST', headers: {'content-type': 'application/json'},
    body: JSON.stringify({mutations: [{createOrReplace: draft}, {delete: {id}}]}),
  })
}

async function upload(request, env) {
  const mime = request.headers.get('content-type') || ''
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(mime)) return json({error: 'Bitte JPEG, PNG, WebP oder AVIF verwenden.'}, 415)
  const buffer = await request.arrayBuffer()
  if (buffer.byteLength > 12_000_000) return json({error: 'Bilder dürfen höchstens 12 MB groß sein.'}, 413)
  const name = (request.headers.get('x-file-name') || 'moinander-bild').replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 120)
  return sanity(`/assets/images/${DATASET}?filename=${encodeURIComponent(name)}`, env, {
    method: 'POST', headers: {'content-type': mime}, body: buffer,
  })
}

export default {
  async fetch(request, env) {
    const target = new URL(request.url)
    if (!target.pathname.startsWith('/api/')) {
      if (target.pathname === '/' || target.pathname === '/studio') return Response.redirect(new URL('/studio/', target), 302)
      if (target.pathname === '/studio/') {
        const page = new URL('/editor', target)
        return env.ASSETS.fetch(new Request(page, request))
      }
      return env.ASSETS.fetch(request)
    }
    const list = accounts(env)
    if (!list) return json({error: 'Die Studio-Anmeldung ist noch nicht eingerichtet.'}, 503)
    if (target.pathname === '/api/session' && request.method === 'GET') return json({user: await getSession(request, env, list)})
    if (target.pathname === '/api/login' && request.method === 'POST') return login(request, env, list)
    const session = await getSession(request, env, list)
    if (!session) return json({error: 'Bitte im Moinander Studio anmelden.'}, 401)
    if (request.method !== 'GET' && (!sameOrigin(request) || request.headers.get('x-csrf-token') !== session.csrf)) return json({error: 'Ungültige Sicherheitsprüfung.'}, 403)
    if (target.pathname === '/api/logout' && request.method === 'POST') return json({ok: true}, 200, {'set-cookie': clearedSessionCookie(request)})
    if (target.pathname === '/api/health' && request.method === 'GET') return json({ready: Boolean(env.SANITY_WRITE_TOKEN), project: PROJECT, dataset: DATASET})
    if (target.pathname === '/api/documents' && request.method === 'GET') {
      const type = target.searchParams.get('type')
      if (!TYPES.has(type)) return json({error: 'Unbekannter Inhaltsbereich.'}, 400)
      return sanity(`/data/query/${DATASET}?query=${encodeURIComponent(`*[_type == "${type}"] | order(_updatedAt desc) { ..., "imageUrl": image.asset->url, "logoUrl": logo.asset->url, "portraitUrl": portrait.asset->url, body[]{ ..., "imageUrl": asset->url } }`)}&perspective=raw`, env)
    }
    if (target.pathname === '/api/documents' && request.method === 'POST') return save(request, env)
    if (target.pathname === '/api/status' && request.method === 'POST') return changeStatus(request, env)
    if (target.pathname === '/api/upload' && request.method === 'POST') return upload(request, env)
    return json({error: 'Nicht gefunden.'}, 404)
  },
}

export {cleanDocument}
