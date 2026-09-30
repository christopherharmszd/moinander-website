import {useEffect, useRef, useState} from 'react'

export function sizedImage(url, width) {
  if (!url) return ''
  try {
    const image = new URL(url)
    if (image.hostname !== 'cdn.sanity.io') return url
    image.searchParams.set('w', String(width))
    image.searchParams.set('fit', 'max')
    image.searchParams.set('auto', 'format')
    return image.toString()
  } catch { return url }
}

function Caption({image}) {
  if (!image.caption && !image.credit) return null
  return <figcaption>{image.caption}{image.caption && image.credit && <span> · </span>}{image.credit}</figcaption>
}

export default function Gallery({images = []}) {
  const [active, setActive] = useState(-1)
  const closeButton = useRef(null)
  const returnFocus = useRef(null)
  const photos = images.filter((image) => image.imageUrl)
  const open = active >= 0

  useEffect(() => {
    if (!open) return
    closeButton.current?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKeyDown(event) {
      if (event.key === 'Escape') close()
      if (event.key === 'ArrowRight') setActive((index) => (index + 1) % photos.length)
      if (event.key === 'ArrowLeft') setActive((index) => (index - 1 + photos.length) % photos.length)
      if (event.key === 'Tab') {
        const buttons = [...document.querySelectorAll('.gallery-lightbox button')]
        const first = buttons[0], last = buttons[buttons.length - 1]
        if (event.shiftKey && document.activeElement === first) {event.preventDefault(); last?.focus()}
        else if (!event.shiftKey && document.activeElement === last) {event.preventDefault(); first?.focus()}
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {window.removeEventListener('keydown', onKeyDown); document.body.style.overflow = previousOverflow}
  }, [open, photos.length])

  function close() { setActive(-1); requestAnimationFrame(() => returnFocus.current?.focus()) }
  if (!photos.length) return null
  const selected = photos[active]
  return <section className="article-gallery" aria-label={`Bildergalerie mit ${photos.length} Bildern`}>
    <div className="article-gallery-grid">{photos.map((image, index) => <figure key={image._key || index}>
      <button type="button" aria-label={`Bild ${index + 1} von ${photos.length} groß öffnen`} onClick={(event) => {returnFocus.current = event.currentTarget; setActive(index)}}>
        <img src={sizedImage(image.imageUrl, 720)} alt={image.alt || ''} loading="lazy" />
      </button>
      <Caption image={image} />
    </figure>)}</div>
    {selected && <div className="gallery-lightbox" role="dialog" aria-modal="true" aria-label={`Bild ${active + 1} von ${photos.length}`} onMouseDown={(event) => {if (event.target === event.currentTarget) close()}}>
      <button ref={closeButton} className="gallery-close" type="button" onClick={close} aria-label="Bildansicht schließen">×</button>
      {photos.length > 1 && <button className="gallery-prev" type="button" onClick={() => setActive((active - 1 + photos.length) % photos.length)} aria-label="Vorheriges Bild">←</button>}
      <figure><img src={sizedImage(selected.imageUrl, 1800)} alt={selected.alt || ''} /><Caption image={selected} /></figure>
      {photos.length > 1 && <button className="gallery-next" type="button" onClick={() => setActive((active + 1) % photos.length)} aria-label="Nächstes Bild">→</button>}
    </div>}
  </section>
}
