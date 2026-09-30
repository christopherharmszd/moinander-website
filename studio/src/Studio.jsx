import React, {useEffect, useMemo, useState} from 'react'

const AREAS = [
  {key: 'project', label: 'Projekte & Beiträge', singular: 'Projektbeitrag', intro: 'Förderprojekte, Schulaktionen und Einblicke aus der Region.'},
  {key: 'event', label: 'Termine', singular: 'Termin', intro: 'Öffentliche Veranstaltungen und Aktionen. Der nächste Termin erscheint automatisch auf der Startseite.'},
  {key: 'partner', label: 'Partner & Sponsoren', singular: 'Partner', intro: 'Menschen und Organisationen, die Moinander unterstützen.'},
  {key: 'boardMember', label: 'Vorstand', singular: 'Vorstandsmitglied', intro: 'Gewählte Personen und ihre Ämter im Verein.'},
]
const TEMPLATES = [
  {value: 'short', label: 'Kurzer Beitrag', description: 'Für kurze Neuigkeiten mit wenigen Absätzen und optionalen Bildern.'},
  {value: 'photo', label: 'Bildbericht', description: 'Für viele Bilder mit kurzen Texten dazwischen. Zwei Bildplätze sind vorbereitet.'},
  {value: 'feature', label: 'Ausführlicher Artikel', description: 'Für längere Geschichten mit Abschnitten und Zwischenüberschriften.'},
  {value: 'gallery', label: 'Galeriebeitrag', description: 'Kurzer Text und viele Bilder. Lade mehrere Fotos auf einmal hoch und ordne sie danach.'},
]
const EMPTY = {
  project: {title: '', slug: '', kind: 'Förderprojekt', articleTemplate: 'short', summary: '', body: [], featuredOnHome: false, homeOrder: '', imageAssetId: '', imageAlt: '', coverImageKey: ''},
  event: {title: '', startsAt: '', endsAt: '', location: '', summary: '', description: '', link: ''},
  partner: {name: '', kind: 'Partner', summary: '', website: '', sortOrder: '', imageAssetId: '', imageAlt: ''},
  boardMember: {name: '', role: '', sortOrder: '', imageAssetId: '', imageAlt: ''},
}
let csrf = ''

async function api(path, options = {}) {
  const response = await fetch(`/api/${path}`, {
    ...options,
    credentials: 'same-origin',
    headers: {...(options.method && options.method !== 'GET' && csrf ? {'x-csrf-token': csrf} : {}), ...(options.headers || {})},
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) {
    if (response.status === 401 && path !== 'login') window.dispatchEvent(new Event('studio-session-expired'))
    const error = new Error(result.error || `Anfrage fehlgeschlagen (${response.status}).`)
    error.status = response.status
    throw error
  }
  return result
}

function toLocal(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}
function toIso(value) { return value ? new Date(value).toISOString() : '' }
function plain(blocks) { return Array.isArray(blocks) ? blocks.map((block) => block.children?.map((child) => child.text || '').join('') || '').join('\n\n') : '' }
function newBlock(type = 'text', style = 'normal') { return {key: crypto.randomUUID().replace(/-/g, '').slice(0, 12), type, style, text: '', imageAssetId: '', imageUrl: '', alt: '', caption: '', credit: '', note: '', images: []} }
function starterBlocks(template) {
  if (template === 'gallery') return [newBlock('text'), newBlock('gallery')]
  if (template === 'photo') return [newBlock(), newBlock('image'), newBlock(), newBlock('image')]
  if (template === 'feature') return [newBlock(), newBlock('text', 'h2'), newBlock()]
  return [newBlock()]
}
function isEmptyStructure(blocks) {return blocks.every((block) => !block.text?.trim() && !block.imageAssetId && !block.caption?.trim() && !block.note?.trim() && !block.images?.length)}
function editorBlocks(blocks) {
  if (!Array.isArray(blocks)) return []
  return blocks.map((block) => block._type === 'image' ? {
    ...newBlock('image'), key: block._key, imageAssetId: block.asset?._ref || '',
    imageUrl: block.asset?.url || block.imageUrl || '', alt: block.alt || '',
    caption: block.caption || '', credit: block.credit || '', note: block.note || '',
  } : block._type === 'gallery' ? {
    ...newBlock('gallery'), key: block._key,
    images: (block.images || []).map((item) => ({key: item._key, imageAssetId: item.asset?._ref || '', imageUrl: item.imageUrl || '', alt: item.alt || '', caption: item.caption || '', credit: item.credit || ''})),
  } : block._type === 'textSection' ? {
    ...newBlock(), key: block._key, text: block.text || '',
  } : {
    ...newBlock(), key: block._key,
    style: ['h2', 'h3'].includes(block.style) ? block.style : 'normal',
    text: block.children?.map((child) => child.text || '').join('') || '',
  })
}
function getImageAsset(doc, type) { return (type === 'project' ? doc.image : type === 'partner' ? doc.logo : doc.portrait)?.asset?._ref || '' }
function getImageAlt(doc, type) { return (type === 'project' ? doc.image : type === 'partner' ? doc.logo : doc.portrait)?.alt || '' }
function getImageUrl(doc) { return doc.imageUrl || doc.logoUrl || doc.portraitUrl || '' }
function normalize(list) {
  const map = new Map()
  for (const item of list || []) {
    const id = item._id.replace(/^drafts\./, '')
    if (!map.has(id) || item._id.startsWith('drafts.')) map.set(id, item)
  }
  return [...map.values()]
}
function status(doc) { return doc.archived ? 'Archiviert' : doc._id.startsWith('drafts.') ? 'Entwurf' : 'Veröffentlicht' }
function field(label, value, change, props = {}) {
  const {multiline, ...rest} = props
  return <label className="field"><span>{label}</span>{multiline ? <textarea value={value ?? ''} onChange={(event) => change(event.target.value)} {...rest} /> : <input value={value ?? ''} onChange={(event) => change(event.target.value)} {...rest} />}</label>
}

function Login({onLogin}) {
  const [email, setEmail] = useState('info@moinander.de')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('')
    try {
      await api('login', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({email, password})})
      const result = await api('session')
      if (!result.user) throw new Error('Die Anmeldung konnte nicht bestätigt werden.')
      csrf = result.user.csrf
      setPassword('')
      onLogin(result.user)
    } catch (problem) { setError(problem.message) } finally { setBusy(false) }
  }
  return <main className="login-page"><div className="login-card"><img className="wordmark" src="/assets/logo.png" alt="Moinander" /><p className="eyebrow">MOINANDER REDAKTION</p><h1>Willkommen zurück.</h1><p>Hier pflegst du die Inhalte der Website. Melde dich mit deinem Redaktionszugang an.</p>{error && <p className="alert" role="alert">{error}</p>}<form onSubmit={submit} className="form-stack">{field('E-Mail-Adresse', email, setEmail, {type: 'email', autoComplete: 'username', required: true})}{field('Passwort', password, setPassword, {type: 'password', autoComplete: 'current-password', required: true})}<button className="button primary" disabled={busy}>{busy ? 'Anmeldung läuft …' : 'Anmelden →'}</button></form><small>Geschützter Bereich für das Moinander-Team.</small></div></main>
}

function ImageField({form, update, busy, setBusy, setError}) {
  async function upload(file) {
    if (!file) return
    setBusy(true); setError('')
    try {
      const response = await api('upload', {method: 'POST', headers: {'content-type': file.type, 'x-file-name': file.name}, body: file})
      if (!response.document?._id || !response.document?.url) throw new Error('Das Bild konnte nicht übernommen werden.')
      update('imageAssetId', response.document._id)
      update('imageUrl', response.document.url)
      if (!form.imageAlt) update('imageAlt', file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '))
    } catch (problem) { setError(problem.message) } finally { setBusy(false) }
  }
  return <div className="image-field"><div className="image-preview">{form.imageUrl ? <img src={form.imageUrl} alt={form.imageAlt || 'Vorschau'} /> : <span>Bildvorschau</span>}</div><div><strong>{form.imageAssetId ? 'Bild ausgewählt' : 'Bild hinzufügen'}</strong><p>JPEG, PNG, WebP oder AVIF · maximal 12 MB</p><label className="button secondary upload-button">{busy ? 'Bild wird hochgeladen …' : 'Bild hochladen'}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={busy} onChange={(event) => {upload(event.target.files?.[0]); event.target.value = ''}} /></label>{form.imageAssetId && <button type="button" className="text-button" onClick={() => {update('imageAssetId', ''); update('imageUrl', '')}}>Bild entfernen</button>}</div>{form.imageAssetId && field('Bildbeschreibung für Barrierefreiheit', form.imageAlt, (value) => update('imageAlt', value), {placeholder: 'Was ist auf dem Bild zu sehen?'})}</div>
}

function GalleryEditor({block, update, busy, setBusy, setError, coverImageKey, setCoverImageKey}) {
  const [progress, setProgress] = useState('')
  const images = block.images || []
  const selectedCover = images.some((item) => item.key === coverImageKey) ? coverImageKey : images[0]?.key
  function changeImage(photoKey, patch) {
    update((current) => current.map((item) => item.key === block.key ? {...item, images: item.images.map((photo) => photo.key === photoKey ? {...photo, ...patch} : photo)} : item))
  }
  function moveImage(position, direction) {
    const next = [...images], target = position + direction
    if (target < 0 || target >= next.length) return
    ;[next[position], next[target]] = [next[target], next[position]]
    update((current) => current.map((item) => item.key === block.key ? {...item, images: next} : item))
  }
  function removeImage(photoKey) {
    const remaining = images.filter((photo) => photo.key !== photoKey)
    update((current) => current.map((item) => item.key === block.key ? {...item, images: remaining} : item))
    if (selectedCover === photoKey) setCoverImageKey(remaining[0]?.key || '')
  }
  async function uploadFiles(fileList) {
    const files = Array.from(fileList || [])
    if (!files.length) return
    if (images.length + files.length > 60) {setError('Eine Galerie darf höchstens 60 Bilder enthalten.'); return}
    if (files.some((file) => !['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type) || file.size > 12_000_000)) {
      setError('Bitte nur JPEG, PNG, WebP oder AVIF mit höchstens 12 MB je Bild auswählen.'); return
    }
    setBusy(true); setError(''); setProgress(`0 von ${files.length} Bildern hochgeladen`)
    const uploaded = [], failed = []
    try {
      for (let offset = 0; offset < files.length; offset += 3) {
        const batch = files.slice(offset, offset + 3)
        const results = await Promise.allSettled(batch.map(async (file) => {
          const response = await api('upload', {method: 'POST', headers: {'content-type': file.type, 'x-file-name': file.name}, body: file})
          if (!response.document?._id || !response.document?.url) throw new Error('Upload fehlgeschlagen')
          return {key: crypto.randomUUID().replace(/-/g, '').slice(0, 12), imageAssetId: response.document._id,
            imageUrl: response.document.url, alt: file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '), caption: '', credit: ''}
        }))
        results.forEach((result, index) => result.status === 'fulfilled' ? uploaded.push(result.value) : failed.push(batch[index].name))
        setProgress(`${Math.min(offset + batch.length, files.length)} von ${files.length} Bildern verarbeitet`)
      }
      if (uploaded.length) {
        update((current) => current.map((item) => item.key === block.key ? {...item, images: [...(item.images || []), ...uploaded]} : item))
        if (!selectedCover) setCoverImageKey(uploaded[0].key)
      }
      if (failed.length) setError(`${failed.length} Bild(er) konnten nicht hochgeladen werden: ${failed.join(', ')}`)
    } finally {setBusy(false); setProgress('')}
  }
  return <div className="gallery-editor">
    <p>{images.length} {images.length === 1 ? 'Bild' : 'Bilder'} in dieser Galerie. Alle hochgeladenen Bilder erscheinen im Beitrag.</p>
    <label className="button secondary upload-button">{busy ? 'Bilder werden hochgeladen …' : 'Mehrere Bilder hochladen'}
      <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple disabled={busy} onChange={(event) => {uploadFiles(event.target.files); event.target.value = ''}} />
    </label>
    {progress && <p role="status">{progress}</p>}
    <div className="gallery-editor-list">{images.map((photo, position) => <div className="gallery-editor-photo" key={photo.key}>
      <div className="gallery-editor-photo-head"><strong>Bild {position + 1}</strong><div>
          <button type="button" disabled={busy || position === 0} onClick={() => moveImage(position, -1)} aria-label={`Bild ${position + 1} nach vorne`}>↑</button>
          <button type="button" disabled={busy || position === images.length - 1} onClick={() => moveImage(position, 1)} aria-label={`Bild ${position + 1} nach hinten`}>↓</button>
          <button type="button" disabled={busy} onClick={() => removeImage(photo.key)} aria-label={`Bild ${position + 1} entfernen`}>×</button>
      </div></div>
      <img src={photo.imageUrl} alt={photo.alt || ''} />
      <label className="gallery-cover"><input type="radio" name={`cover-${block.key}`} checked={photo.key === selectedCover} onChange={() => setCoverImageKey(photo.key)} /> Titelbild für Übersicht</label>
      <details><summary>Bildtext & Beschreibung</summary><div className="gallery-editor-photo-fields">
          {field('Bildbeschreibung für Barrierefreiheit', photo.alt, (value) => changeImage(photo.key, {alt: value}), {maxLength: 300, placeholder: 'Motiv beschreiben'})}
          {field('Bildunterschrift (optional)', photo.caption, (value) => changeImage(photo.key, {caption: value}), {maxLength: 300, placeholder: 'Was ist auf diesem Bild zu sehen?'})}
          {field('Bildnachweis (optional)', photo.credit, (value) => changeImage(photo.key, {credit: value}), {maxLength: 200, placeholder: 'Foto: Name'})}
      </div></details>
    </div>)}</div>
  </div>
}

function BodyEditor({blocks, update, busy, setBusy, setError, coverImageKey, setCoverImageKey}) {
  const [openKeys, setOpenKeys] = useState(() => new Set())
  function toggle(id) {setOpenKeys((old) => {const next = new Set(old); next.has(id) ? next.delete(id) : next.add(id); return next})}
  function change(index, patch) { update(blocks.map((block, position) => position === index ? {...block, ...patch} : block)) }
  function insert(index, type, style = 'normal') {const block = newBlock(type, style); update([...blocks.slice(0, index), block, ...blocks.slice(index)]); setOpenKeys((old) => new Set([...old, block.key]))}
  function remove(index) { update(blocks.filter((_, position) => position !== index)) }
  function mergeWithNext(index) {
    const next = blocks[index + 1]
    if (blocks[index]?.type !== 'text' || blocks[index]?.style !== 'normal' || next?.type !== 'text' || next?.style !== 'normal') return
    const merged = [blocks[index].text.trim(), next.text.trim()].filter(Boolean).join('\n\n')
    update(blocks.flatMap((block, position) => position === index ? [{...block, text: merged}] : position === index + 1 ? [] : [block]))
  }
  function move(index, direction) {
    const next = [...blocks], target = index + direction
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    update(next)
  }
  async function upload(index, file) {
    if (!file) return
    if (file.size > 12_000_000) {setError('Bilder dürfen höchstens 12 MB groß sein.'); return}
    setBusy(true); setError('')
    try {
      const response = await api('upload', {method: 'POST', headers: {'content-type': file.type, 'x-file-name': file.name}, body: file})
      if (!response.document?._id || !response.document?.url) throw new Error('Das Bild konnte nicht übernommen werden.')
      update((current) => current.map((block, position) => position === index ? {
        ...block, imageAssetId: response.document._id, imageUrl: response.document.url,
        alt: block.alt || file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
      } : block))
    } catch (problem) {setError(problem.message)} finally {setBusy(false)}
  }
  const additions = (index) => <div className="block-add"><button type="button" onClick={() => insert(index, 'text')}>+ Textabschnitt</button><button type="button" onClick={() => insert(index, 'text', 'h2')}>+ Überschrift</button><button type="button" onClick={() => insert(index, 'image')}>+ Bild</button><button type="button" onClick={() => insert(index, 'gallery')}>+ Galerie</button></div>
  return <section className="body-editor"><div className="body-editor-head"><div><h3>Beitrag gestalten</h3><p>Ein Textabschnitt kann mehrere Absätze enthalten. Trenne sie mit einer Leerzeile; Bilder und Überschriften setzt du dazwischen.</p></div></div>
    {blocks.length === 0 && <p className="body-empty">Beginne mit einem Absatz, einer Überschrift oder einem Bild.</p>}
    {blocks.map((block, index) => <React.Fragment key={block.key}><div className={`body-block ${block.type === 'image' ? 'image-block' : ''}`}><div className="body-block-bar"><strong>{block.type === 'image' ? `Bild ${index + 1}` : block.type === 'gallery' ? `Galerie ${index + 1}` : block.style === 'h2' ? `Überschrift ${index + 1}` : block.style === 'h3' ? `Zwischenüberschrift ${index + 1}` : `Textabschnitt ${index + 1}`}</strong><div><button type="button" onClick={() => toggle(block.key)} aria-expanded={openKeys.has(block.key)}>{openKeys.has(block.key) ? 'Schließen' : 'Bearbeiten'}</button><button type="button" title="Nach oben" aria-label={`Block ${index + 1} nach oben`} disabled={busy || index === 0} onClick={() => move(index, -1)}>↑</button><button type="button" title="Nach unten" aria-label={`Block ${index + 1} nach unten`} disabled={busy || index === blocks.length - 1} onClick={() => move(index, 1)}>↓</button><button type="button" title="Block entfernen" aria-label={`Block ${index + 1} entfernen`} disabled={busy} onClick={() => remove(index)}>×</button></div></div>
      {!openKeys.has(block.key) && <p className="body-block-summary">{block.type === 'image' ? (block.caption || block.note || (block.imageAssetId ? 'Bild hochgeladen' : 'Bild fehlt noch')) : block.type === 'gallery' ? `${block.images?.length || 0} Bilder` : (block.text || 'Noch kein Text')}</p>}
      {openKeys.has(block.key) && (block.type === 'gallery' ? <GalleryEditor block={block} update={update} busy={busy} setBusy={setBusy} setError={setError} coverImageKey={coverImageKey} setCoverImageKey={setCoverImageKey} /> : block.type === 'image' ? <><div className="inline-image-preview">{block.imageUrl ? <img src={block.imageUrl} alt={block.alt || 'Bildvorschau'} /> : <span>{block.note || 'Noch kein Bild hochgeladen'}</span>}</div><label className="button secondary upload-button">{block.imageAssetId ? 'Bild ersetzen' : 'Bild hochladen'}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={busy} onChange={(event) => {upload(index, event.target.files?.[0]); event.target.value = ''}} /></label>{field('Bildunterschrift', block.caption, (value) => change(index, {caption: value}), {maxLength: 300, placeholder: 'Was zeigt dieses Bild?'})}{field('Bildbeschreibung für Barrierefreiheit', block.alt, (value) => change(index, {alt: value}), {maxLength: 300, placeholder: 'Motiv und wichtige Details beschreiben'})}{field('Bildnachweis', block.credit, (value) => change(index, {credit: value}), {maxLength: 200, placeholder: 'Zum Beispiel Foto: Name'})}{!block.imageAssetId && field('Redaktionelle Notiz (nicht öffentlich)', block.note, (value) => change(index, {note: value}), {maxLength: 300, placeholder: 'Welches Foto fehlt noch?'})}</> : <><label className="field"><span>Textart</span><select value={block.style} onChange={(event) => change(index, {style: event.target.value})}><option value="normal">Textabschnitt</option><option value="h2">Überschrift</option><option value="h3">Zwischenüberschrift</option></select></label>{field('Text', block.text, (value) => change(index, {text: value}), {multiline: true, rows: block.style === 'normal' ? 8 : 2, placeholder: block.style === 'normal' ? 'Text eingeben – Leerzeile für einen neuen Absatz …' : 'Überschrift eingeben …'})}{block.style === 'normal' && <small className="block-help">Eine Leerzeile erzeugt einen neuen Absatz auf der Website.</small>}{block.style === 'normal' && blocks[index + 1]?.type === 'text' && blocks[index + 1]?.style === 'normal' && <button type="button" className="text-button merge-button" onClick={() => mergeWithNext(index)}>Mit nächstem Textabschnitt verbinden</button>}{/^\[Foto:.*\]$/s.test(block.text.trim()) && <button type="button" className="text-button" onClick={() => change(index, {type: 'image', note: block.text.slice(1, -1).replace(/^Foto:\s*/, '')})}>Diesen Foto-Hinweis in einen Bildplatz umwandeln</button>}</>)}
    </div>{additions(index + 1)}</React.Fragment>)}
    {blocks.length === 0 && additions(0)}
  </section>
}

function Editor({type, initial, onClose, onSaved}) {
  const isPublished = Boolean(initial && !initial._id.startsWith('drafts.'))
  const [form, setForm] = useState(() => initial ? {
    ...initial,
    _id: initial._id.replace(/^drafts\./, ''),
    slug: initial.slug?.current || '',
    body: type === 'project' ? editorBlocks(initial.body) : initial.body,
    description: plain(initial.description),
    startsAt: toLocal(initial.startsAt), endsAt: toLocal(initial.endsAt),
    imageAssetId: getImageAsset(initial, type), imageAlt: getImageAlt(initial, type), imageUrl: getImageUrl(initial),
    homeOrder: initial.homeOrder ?? '', sortOrder: initial.sortOrder ?? '',
  } : {...EMPTY[type], ...(type === 'project' ? {body: starterBlocks('short')} : {})})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const area = AREAS.find((item) => item.key === type)
  function update(key, value) { setForm((old) => ({...old, [key]: value})) }
  function changeTemplate(value) {
    setForm((old) => ({...old, articleTemplate: value,
      body: !initial && isEmptyStructure(old.body) ? starterBlocks(value)
        : value === 'gallery' && !old.body.some((block) => block.type === 'gallery') ? [...old.body, newBlock('gallery')] : old.body,
    }))
  }
  async function save(publish) {
    setBusy(true); setError('')
    try {
      const payload = {...form, _type: type, publish,
        startsAt: type === 'event' ? toIso(form.startsAt) : undefined,
        endsAt: type === 'event' ? toIso(form.endsAt) : undefined,
      }
      await api('documents', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify(payload)})
      await onSaved()
    } catch (problem) { setError(problem.message) } finally { setBusy(false) }
  }
  async function act(action) {
    if (!initial) return
    if (action === 'archive' && !window.confirm('Diesen Inhalt archivieren? Er verschwindet von der Website.')) return
    if (action === 'delete' && !window.confirm('Diesen Entwurf endgültig löschen?')) return
    setBusy(true); setError('')
    try {
      await api('status', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({type, id: form._id, action})})
      await onSaved()
    } catch (problem) { setError(problem.message) } finally { setBusy(false) }
  }
  return <div className="modal-backdrop"><section className="editor" role="dialog" aria-modal="true" aria-label={`${area.singular} bearbeiten`}><header className="editor-head"><div><p className="eyebrow">{initial ? status(initial) : 'NEUER INHALT'}</p><h2>{initial ? `${area.singular} bearbeiten` : `${area.singular} anlegen`}</h2><p>Ein Entwurf bleibt intern. Veröffentlichen zeigt den Inhalt auf der Website.</p></div><button className="close" onClick={onClose} aria-label="Schließen">×</button></header><div className="editor-body">{error && <p className="alert" role="alert">{error}</p>}
    {type === 'project' && <>
      {field('Titel *', form.title, (value) => update('title', value), {required: true, placeholder: 'Worum geht es in diesem Beitrag?'})}
      {field('Webadresse', form.slug?.current ?? form.slug ?? '', (value) => update('slug', value), {placeholder: 'Wird aus dem Titel erzeugt, wenn leer'})}
      <label className="field"><span>Art des Beitrags</span><select value={form.kind || 'Förderprojekt'} onChange={(event) => update('kind', event.target.value)}>{['Förderprojekt', 'Schule & Jugend', 'Aus der Region', 'Vereinsprojekt'].map((item) => <option key={item}>{item}</option>)}</select></label>
      <label className="field"><span>Beitragsvorlage</span><select value={form.articleTemplate || 'feature'} onChange={(event) => changeTemplate(event.target.value)}>{TEMPLATES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select><small>{TEMPLATES.find((item) => item.value === (form.articleTemplate || 'feature'))?.description} Vorhandene Texte und Bilder bleiben beim Wechsel erhalten.</small></label>
      {field('Kurzbeschreibung *', form.summary, (value) => update('summary', value), {multiline: true, rows: 3, maxLength: 300, placeholder: 'Ein bis zwei Sätze für Übersichten'})}
      <BodyEditor blocks={form.body} update={(value) => setForm((old) => ({...old, body: typeof value === 'function' ? value(old.body) : value}))} busy={busy} setBusy={setBusy} setError={setError} coverImageKey={form.coverImageKey} setCoverImageKey={(value) => update('coverImageKey', value)} />
      {form.articleTemplate !== 'gallery' && <ImageField form={form} update={update} busy={busy} setBusy={setBusy} setError={setError} />}
      <div className="highlight-box"><label className="check"><input type="checkbox" checked={Boolean(form.featuredOnHome)} onChange={(event) => update('featuredOnHome', event.target.checked)} /> Auf der Startseite zeigen</label>{form.featuredOnHome && <label className="field"><span>Platz auf der Startseite</span><select value={form.homeOrder} onChange={(event) => update('homeOrder', event.target.value)}><option value="">Bitte wählen</option><option value="1">1 · zuerst</option><option value="2">2 · danach</option><option value="3">3 · zuletzt</option></select></label>}<small>Es gibt drei Plätze. Jeder Platz kann nur einmal vergeben werden.</small></div>
    </>}
    {type === 'event' && <>
      {field('Titel *', form.title, (value) => update('title', value), {placeholder: 'Name der Veranstaltung'})}
      <div className="two-col">{field('Beginn *', form.startsAt, (value) => update('startsAt', value), {type: 'datetime-local'})}{field('Ende', form.endsAt, (value) => update('endsAt', value), {type: 'datetime-local'})}</div>
      {field('Ort', form.location, (value) => update('location', value), {placeholder: 'Adresse oder Veranstaltungsort'})}
      {field('Kurzbeschreibung *', form.summary, (value) => update('summary', value), {multiline: true, rows: 3, maxLength: 300})}
      {field('Weitere Informationen', form.description, (value) => update('description', value), {multiline: true, rows: 7, placeholder: 'Absätze mit einer Leerzeile trennen'})}
      {field('Weiterführender Link', form.link, (value) => update('link', value), {type: 'url', placeholder: 'https://…'})}
    </>}
    {type === 'partner' && <>
      {field('Name *', form.name, (value) => update('name', value))}
      <label className="field"><span>Art</span><select value={form.kind || 'Partner'} onChange={(event) => update('kind', event.target.value)}><option>Partner</option><option>Sponsor</option></select></label>
      {field('Beschreibung', form.summary, (value) => update('summary', value), {multiline: true, rows: 4})}
      {field('Website', form.website, (value) => update('website', value), {type: 'url', placeholder: 'https://…'})}
      {field('Reihenfolge', form.sortOrder, (value) => update('sortOrder', value), {type: 'number', min: 0, placeholder: 'Optional'})}
      <ImageField form={form} update={update} busy={busy} setBusy={setBusy} setError={setError} />
    </>}
    {type === 'boardMember' && <>
      {field('Name *', form.name, (value) => update('name', value))}
      {field('Amt *', form.role, (value) => update('role', value), {placeholder: 'Zum Beispiel Vorsitzende/r'})}
      {field('Reihenfolge', form.sortOrder, (value) => update('sortOrder', value), {type: 'number', min: 0, placeholder: 'Optional'})}
      <ImageField form={form} update={update} busy={busy} setBusy={setBusy} setError={setError} />
    </>}
  </div><footer className="editor-actions"><div>{initial?.archived && <button className="button secondary" disabled={busy} onClick={() => act('restore')}>Aus Archiv holen</button>}{isPublished && <button className="button secondary" disabled={busy} onClick={() => act('unpublish')}>Zurück zum Entwurf</button>}{initial && !initial.archived && <button className="text-button danger" disabled={busy} onClick={() => act('archive')}>Archivieren</button>}{initial && !isPublished && <button className="text-button danger" disabled={busy} onClick={() => act('delete')}>Entwurf löschen</button>}</div><div><button className="button secondary" disabled={busy} onClick={() => save(false)}>{busy ? 'Speichert …' : 'Als Entwurf speichern'}</button><button className="button primary" disabled={busy || Boolean(initial?.archived)} onClick={() => save(true)}>{busy ? 'Speichert …' : 'Veröffentlichen'}</button></div></footer></section></div>
}

export function Studio() {
  const [auth, setAuth] = useState({checking: true, configured: true, user: null})
  const [active, setActive] = useState('overview')
  const [data, setData] = useState({project: [], event: [], partner: [], boardMember: []})
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [editor, setEditor] = useState(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('Alle')
  const [menu, setMenu] = useState(false)
  useEffect(() => {
    let live = true
    api('session').then((result) => { if (live) {csrf = result.user?.csrf || ''; setAuth({checking: false, configured: true, user: result.user})} })
      .catch((problem) => { if (live) setAuth({checking: false, configured: problem.status !== 503, user: null}) })
    const expired = () => {csrf = ''; setAuth({checking: false, configured: true, user: null})}
    window.addEventListener('studio-session-expired', expired)
    return () => {live = false; window.removeEventListener('studio-session-expired', expired)}
  }, [])
  async function load() {
    try {
      const health = await api('health')
      setReady(health.ready)
      if (!health.ready) return
      const entries = await Promise.all(AREAS.map(async (area) => [area.key, normalize((await api(`documents?type=${area.key}`)).result)]))
      setData(Object.fromEntries(entries)); setError('')
    } catch (problem) {setError(problem.message)}
  }
  useEffect(() => {if (auth.user) load()}, [auth.user?.email])
  async function logout() {
    try {await api('logout', {method: 'POST'}); csrf = ''; setAuth({checking: false, configured: true, user: null}); setData({project: [], event: [], partner: [], boardMember: []})}
    catch (problem) {setError(problem.message)}
  }
  const area = AREAS.find((item) => item.key === active)
  const visible = useMemo(() => (data[active] || []).filter((item) => {
    const matchingStatus = filter === 'Alle' || status(item) === filter
    const matchingText = `${item.title || ''} ${item.name || ''} ${item.summary || ''} ${item.role || ''}`.toLowerCase().includes(query.toLowerCase())
    return matchingStatus && matchingText
  }), [active, data, filter, query])
  if (auth.checking) return <main className="loading">Moinander Redaktion wird geladen …</main>
  if (!auth.configured) return <main className="loading"><h1>Redaktion wird eingerichtet.</h1><p>Der Zugang ist derzeit noch gesperrt.</p></main>
  if (!auth.user) return <Login onLogin={(user) => setAuth({checking: false, configured: true, user})} />
  return <div className="shell"><aside className={`sidebar ${menu ? 'open' : ''}`}><a className="brand" href="https://moinander.de/"><img src="/assets/logo.png" alt="Moinander" /></a><p className="sidebar-label">REDAKTION</p><nav aria-label="Redaktionsbereiche"><button className={active === 'overview' ? 'active' : ''} onClick={() => {setActive('overview'); setMenu(false)}}>Übersicht</button>{AREAS.map((item) => <button key={item.key} className={active === item.key ? 'active' : ''} onClick={() => {setActive(item.key); setQuery(''); setFilter('Alle'); setMenu(false)}}>{item.label}</button>)}</nav><div className="sidebar-bottom"><span className={`dot ${ready ? 'ready' : ''}`} /> {ready ? 'Inhaltsspeicher verbunden' : 'Verbindung prüfen'}</div></aside><main className="main"><header className="topbar"><button className="mobile-menu" onClick={() => setMenu(!menu)} aria-expanded={menu}>☰ Menü</button><span>Redaktion / {area?.label || 'Übersicht'}</span><div><a href="https://moinander.de/" target="_blank" rel="noreferrer">Website ansehen ↗</a><button onClick={logout}>Abmelden</button></div></header><div className="content"><div className="page-head"><div><p className="eyebrow">MOINANDER CMS</p><h1>{area?.label || 'Übersicht'}</h1><p>{area?.intro || 'Hier verwaltest du die öffentlichen Inhalte von Moinander.'}</p></div>{area && <button className="button primary" disabled={!ready} onClick={() => setEditor({type: area.key})}>+ {area.singular} anlegen</button>}</div>{error && <p className="alert" role="alert">{error} <button onClick={() => setError('')}>Schließen</button></p>}{!ready && <p className="alert">Die Verbindung zu Sanity ist noch nicht vollständig eingerichtet. Änderungen sind bis dahin gesperrt.</p>}
    {active === 'overview' ? <><div className="stat-grid">{AREAS.map((item) => <button key={item.key} onClick={() => setActive(item.key)}><span>{item.label}</span><strong>{data[item.key]?.length || 0}</strong><small>Öffnen →</small></button>)}</div><section className="help-panel"><p className="eyebrow">SO FUNKTIONIERT ES</p><h2>Von der Idee zur Website.</h2><div className="steps"><div><b>01</b><h3>Inhalt anlegen</h3><p>Text, Datum und Bilder in einer einfachen Maske eintragen.</p></div><div><b>02</b><h3>Entwurf prüfen</h3><p>Unveröffentlichte Inhalte bleiben nur hier in der Redaktion.</p></div><div><b>03</b><h3>Veröffentlichen</h3><p>Der Beitrag erscheint auf der passenden Seite. Termine aktualisieren die Startseite automatisch.</p></div></div></section></> : <><div className="filters"><input aria-label="Inhalte suchen" placeholder="Titel oder Name suchen …" value={query} onChange={(event) => setQuery(event.target.value)} /><div>{['Alle', 'Veröffentlicht', 'Entwurf', 'Archiviert'].map((item) => <button key={item} className={filter === item ? 'selected' : ''} onClick={() => setFilter(item)}>{item}</button>)}</div><span>{visible.length} Einträge</span></div><div className="cards">{visible.map((item) => <button className="card" key={item._id} onClick={() => setEditor({type: active, initial: item})}><div className="thumb">{getImageUrl(item) ? <img src={getImageUrl(item)} alt="" /> : <span>{(item.title || item.name || '?')[0]}</span>}</div><div><small className="card-status">{status(item)}{item.kind ? ` · ${item.kind}` : ''}</small><h2>{item.title || item.name}</h2><p>{item.summary || item.role || (item.startsAt ? new Date(item.startsAt).toLocaleString('de-DE') : 'Details bearbeiten')}</p></div><b>Bearbeiten →</b></button>)}</div>{!visible.length && <div className="empty"><h2>Noch keine passenden Einträge.</h2><p>Lege einen Inhalt an oder passe die Suche an.</p></div>}</>}
  </div></main>{editor && <Editor key={editor.initial?._id || editor.type} type={editor.type} initial={editor.initial} onClose={() => setEditor(null)} onSaved={async () => {setEditor(null); await load()}} />}</div>
}
